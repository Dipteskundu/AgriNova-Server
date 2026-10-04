const express = require("express");
const { validationResult } = require("express-validator");
const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");
const QualityRequest = require("../../database/models/QualityRequest");
const User = require("../../database/models/User");
const {
  mapInspectionRequest,
  mapInspectionReport,
  mapScheduleEntry,
} = require("../../utils/domainMaps");
const { logAudit } = require("../../utils/audit");
const { today, dateOnly } = require("../../utils/dates");
const { assignRules, updateRules, submitRules } = require("./quality.validation");

const STATUSES = ["assigned", "in_progress", "completed", "cancelled"];

const isAdmin = (user) =>
  !!user &&
  (user.role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin")));

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const throwIfInvalid = (req) => {
  const result = validationResult(req);
  if (result.isEmpty()) return;
  const err = new Error(result.array().map((e) => e.msg).join("; "));
  err.statusCode = 400;
  throw err;
};

/**
 * Who may see what.
 *
 * An admin sees every record. Everyone else sees only the records they own —
 * `owner` is the assigned inspector. Requests that nobody has been assigned to
 * are therefore admin-only, which is deliberate: an inspector's queue is meant
 * to be a *work list*, and surfacing a shared unclaimed pool would let two
 * inspectors start filling in the same report.
 */
function buildScope(req) {
  const scope = {};

  if (req.query.status) {
    const status = String(req.query.status);
    if (!STATUSES.includes(status)) throw httpError("Unknown status filter", 400);
    scope.status = status;
  }

  if (!isAdmin(req.user)) scope.owner = req.user.id;
  return scope;
}

async function loadRecord(req) {
  const doc = await QualityRequest.findById(req.params.id);
  if (!doc) throw httpError("Inspection not found", 404);
  if (!isAdmin(req.user)) {
    const owned = doc.owner && String(doc.owner) === String(req.user.id);
    if (!owned) throw httpError("You do not have permission to access this inspection", 403);
  }
  return doc;
}

/** QC-26-4821 — mirrors the shape already used by the seeded certificates. */
async function nextCertificateNumber() {
  const yy = String(new Date().getFullYear()).slice(-2);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `QC-${yy}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    if (!(await QualityRequest.exists({ certificateNumber: code }))) return code;
  }
  return `QC-${yy}-${Date.now().toString().slice(-4)}`;
}

/** Whitelist for create/update so a client cannot smuggle schema fields in. */
const ASSIGNABLE_FIELDS = [
  "batchCode",
  "produceType",
  "farmerName",
  "farmerPhone",
  "farmLocation",
  "variety",
  "quantityKg",
  "requestedAt",
  "scheduledDate",
  "priority",
  "status",
  "notes",
  "testingLabLocation",
];

function pick(body, keys) {
  const out = {};
  keys.forEach((key) => {
    if (body[key] !== undefined && body[key] !== null) out[key] = body[key];
  });
  return out;
}

const router = express.Router();

/**
 * Quality inspection portal — MARKETPLACE_PORTAL_PLAN Step 5.
 *
 *   GET    /api/quality              the caller's inspections (admin: all)
 *   GET    /api/quality/reports      submitted reports
 *   GET    /api/quality/schedule     dated, still-open inspections
 *   GET    /api/quality/:id          one inspection
 *   POST   /api/quality              raise one (admin assigns, inspector owns)
 *   PUT    /api/quality/:id          edit an assignment
 *   POST   /api/quality/:id/start    begin work
 *   POST   /api/quality/:id/submit   record measurements and close it
 *
 * Hand-written rather than `crudFactory`-generated because one record serves
 * as both the assignment and the report: the factory's owner-scoping is a
 * single fixed key, but `submit` must additionally claim an inspection, and
 * `owner` has to stay admin-settable while still being immutable to anyone
 * trying to hand themselves someone else's work.
 *
 * `/reports` and `/schedule` are declared before `/:id` so they are not
 * swallowed as an `:id` capture.
 */

router.get("/", auth, role(["inspector", "admin"]), async (req, res, next) => {
  try {
    const scope = buildScope(req);
    const docs = await QualityRequest.find(scope).sort({
      scheduledDate: 1,
      createdAt: -1,
      _id: -1,
    });
    res.json(docs.map(mapInspectionRequest));
  } catch (err) {
    next(err);
  }
});

router.get("/reports", auth, role(["inspector", "admin"]), async (req, res, next) => {
  try {
    const scope = { ...buildScope(req), status: "completed" };
    const docs = await QualityRequest.find(scope).sort({
      inspectionDate: -1,
      createdAt: -1,
      _id: -1,
    });
    res.json(docs.map(mapInspectionReport));
  } catch (err) {
    next(err);
  }
});

router.get("/schedule", auth, role(["inspector", "admin"]), async (req, res, next) => {
  try {
    const scope = {
      ...buildScope(req),
      status: { $in: ["assigned", "in_progress"] },
      scheduledDate: { $nin: [null, ""] },
    };
    const docs = await QualityRequest.find(scope).sort({ scheduledDate: 1, _id: 1 });
    res.json(docs.map(mapScheduleEntry));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", auth, role(["inspector", "admin"]), async (req, res, next) => {
  try {
    res.json(mapInspectionRequest(await loadRecord(req)));
  } catch (err) {
    next(err);
  }
});

router.post("/", auth, role(["inspector", "admin"]), assignRules(), async (req, res, next) => {
  try {
    throwIfInvalid(req);

    const payload = pick(req.body, ASSIGNABLE_FIELDS);
    // An admin picks who the work goes to; an inspector raising their own
    // inspection is pinned to themselves so the two can never diverge.
    const assignee = isAdmin(req.user)
      ? req.body.owner || null
      : req.user.id;
    payload.owner = assignee;
    payload.status = payload.status || "assigned";
    payload.requestedAt = payload.requestedAt || today();

    // `inspectorName` is denormalised for the admin quality list, which reads
    // it straight off the document — keep it in step with the assignment
    // instead of stamping the caller's name onto someone else's work.
    if (assignee && String(assignee) !== String(req.user.id)) {
      const inspector = await User.findById(assignee).select("name").lean();
      payload.inspectorName = (inspector && inspector.name) || "";
    } else {
      payload.inspectorName = req.user.name || "";
    }

    const doc = await QualityRequest.create(payload);
    await logAudit({
      req,
      action: "CREATE",
      entity: "QualityRequest",
      entityId: String(doc._id),
      details: `Inspection ${doc.batchCode}`,
    });
    res.status(201).json(mapInspectionRequest(doc));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", auth, role(["inspector", "admin"]), updateRules(), async (req, res, next) => {
  try {
    throwIfInvalid(req);
    const doc = await loadRecord(req);

    Object.assign(doc, pick(req.body, ASSIGNABLE_FIELDS));
    // Reassignment is an admin action: `owner` is stripped from everyone else
    // rather than validated against, so an inspector cannot pull a record out
    // of a colleague's queue by editing it.
    if (isAdmin(req.user) && req.body.owner !== undefined) {
      doc.owner = req.body.owner || null;
      if (doc.owner) {
        const inspector = await User.findById(doc.owner).select("name").lean();
        doc.inspectorName = (inspector && inspector.name) || "";
      }
    }
    await doc.save();

    await logAudit({
      req,
      action: "UPDATE",
      entity: "QualityRequest",
      entityId: String(doc._id),
      details: `Inspection ${doc.batchCode}`,
    });
    res.json(mapInspectionRequest(doc));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/start", auth, role(["inspector", "admin"]), async (req, res, next) => {
  try {
    const doc = await loadRecord(req);
    if (doc.status === "completed") {
      throw httpError("A submitted inspection cannot be reopened", 409);
    }
    if (doc.status === "in_progress") {
      throw httpError("This inspection is already in progress", 409);
    }

    doc.status = "in_progress";
    if (!doc.owner) doc.owner = req.user.id;
    if (!doc.inspectorName) doc.inspectorName = req.user.name || "";
    await doc.save();

    await logAudit({
      req,
      action: "UPDATE",
      entity: "QualityRequest",
      entityId: String(doc._id),
      details: `Started ${doc.batchCode}`,
    });
    res.json(mapInspectionRequest(doc));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/submit", auth, role(["inspector", "admin"]), submitRules(), async (req, res, next) => {
  try {
    throwIfInvalid(req);
    const doc = await loadRecord(req);

    if (doc.status === "completed") {
      throw httpError("This inspection has already been submitted", 409);
    }

    Object.assign(
      doc,
      pick(req.body, [
        "assignedGrade",
        "moistureContentPercent",
        "foreignMatterPercent",
        "aflatoxinPpm",
        "complianceVerdict",
        "visualCondition",
        "recommendedAction",
        "findings",
        "certificateNumber",
        "inspectionDate",
      ])
    );

    if (!doc.moistureStandardThreshold) doc.moistureStandardThreshold = 14;
    doc.inspectionDate = doc.inspectionDate || today();
    if (!doc.certificateNumber) doc.certificateNumber = await nextCertificateNumber();
    if (!doc.inspectorName) doc.inspectorName = req.user.name || "";
    if (!doc.owner) doc.owner = req.user.id;
    doc.status = "completed";
    doc.submittedAt = today();
    await doc.save();

    await logAudit({
      req,
      action: "UPDATE",
      entity: "QualityRequest",
      entityId: String(doc._id),
      details: `Submitted ${doc.batchCode} — ${doc.complianceVerdict}`,
    });
    res.json(mapInspectionReport(doc));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", auth, role(["admin"]), async (req, res, next) => {
  try {
    const doc = await QualityRequest.findById(req.params.id);
    if (!doc) throw httpError("Inspection not found", 404);

    const batchCode = doc.batchCode;
    await doc.deleteOne();

    await logAudit({
      req,
      action: "DELETE",
      entity: "QualityRequest",
      entityId: String(doc._id),
      details: `Inspection ${batchCode}`,
    });
    res.json({ success: true, id: String(doc._id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
