const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const User = require("../../database/models/User");
const { getFirebaseAuth } = require("../../config/firebaseAdmin");

const ALLOWED_ROLES = new Set(["farmer", "buyer", "supplier"]);
const httpError = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const formatUserResponse = (user, token) => {
  const roles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role || "farmer"];
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || roles[0],
      roles,
      phone: user.phone || "",
      address: user.address || "",
      profileImage: user.profileImage || "",
    },
  };
};

exports.register = async (userData) => {
  const { name, email, password, role, phone, roles } = userData;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const requestedRoles = roles === undefined ? [role || "farmer"] : roles;
  if (!normalizedEmail || typeof name !== "string" || !name.trim() || typeof password !== "string" || password.length < 6) {
    throw httpError("Name, valid email, and a password of at least 6 characters are required", 400);
  }
  if (!Array.isArray(requestedRoles) || requestedRoles.length === 0 || requestedRoles.some((item) => !ALLOWED_ROLES.has(item)) || (role && !ALLOWED_ROLES.has(role))) {
    throw httpError("Registration role is invalid", 400);
  }
  const userRoles = [...new Set(requestedRoles)];
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) throw httpError("User already exists", 409);
  const primaryRole = role && userRoles.includes(role) ? role : userRoles[0];
  const user = await User.create({ name: name.trim(), email: normalizedEmail, password, role: primaryRole, roles: userRoles, phone });
  return formatUserResponse(user, generateToken(user._id));
};

exports.login = async (email, password) => {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user || !(await user.matchPassword(password))) throw httpError("Invalid credentials", 401);
  return formatUserResponse(user, generateToken(user._id));
};

exports.getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw httpError("User not found", 404);
  return formatUserResponse(user, generateToken(user._id));
};

exports.socialAuth = async ({ idToken, roles }) => {
  if (typeof idToken !== "string" || !idToken.trim()) throw httpError("A Firebase ID token is required", 400);
  let identity;
  try {
    identity = await getFirebaseAuth().verifyIdToken(idToken, true);
  } catch (error) {
    if (error.statusCode === 503) throw error;
    throw httpError("Invalid or expired social authentication token", 401);
  }
  const firebaseUid = identity.uid;
  const email = typeof identity.email === "string" ? identity.email.trim().toLowerCase() : "";
  if (!firebaseUid || !email) throw httpError("The social account must provide an email address", 401);

  let user = await User.findOne({ firebaseUid });
  if (!user) {
    if (identity.email_verified !== true) throw httpError("Verify your email with the identity provider before signing in", 401);
    user = await User.findOne({ email });
  }
  if (!user) {
    const accountRoles = roles === undefined ? ["farmer"] : roles;
    if (!Array.isArray(accountRoles) || accountRoles.length === 0 || accountRoles.some((item) => !ALLOWED_ROLES.has(item))) {
      throw httpError("Registration role is invalid", 400);
    }
    const uniqueRoles = [...new Set(accountRoles)];
    user = await User.create({
      name: identity.name || email.split("@")[0],
      email,
      role: uniqueRoles[0],
      roles: uniqueRoles,
      phone: "",
      profileImage: identity.picture || "",
      firebaseUid,
      password: await bcrypt.hash(`${crypto.randomUUID()}Aa1!`, 10),
    });
  } else {
    if (user.firebaseUid && user.firebaseUid !== firebaseUid) throw httpError("This account is linked to another identity provider account", 409);
    if (!user.firebaseUid) user.firebaseUid = firebaseUid;
    if (identity.picture && !user.profileImage) user.profileImage = identity.picture;
    await user.save();
  }
  return formatUserResponse(user, generateToken(user._id));
};
