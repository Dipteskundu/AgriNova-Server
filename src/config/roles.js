const ROLE_PORTALS = {
  farmer: "farmer",
  buyer: "marketplace",
  supplier: "marketplace",
  inspector: "operations",
  logistics: "operations",
  support: "support",
  admin: "admin",
};

const PORTAL_ROLES = {
  farmer: ["farmer"],
  marketplace: ["buyer", "supplier"],
  operations: ["inspector", "logistics"],
  support: ["support"],
  admin: ["admin"],
};

const PORTAL_LABELS = {
  farmer: "Farmer",
  marketplace: "Marketplace",
  operations: "Operations",
  support: "Support",
  admin: "Admin",
};

const PORTAL_DESCRIPTIONS = {
  farmer: "Manage your farms, fields, crops, and harvests",
  marketplace: "Buy and sell produce and farming inputs",
  operations: "Quality inspections and delivery tracking",
  support: "Disputes, help desk, and resolution center",
  admin: "Full platform administration and control",
};

const ALL_ROLES = ["farmer", "buyer", "supplier", "inspector", "logistics", "support", "admin"];

const SELF_REGISTER_ROLES = ["farmer", "buyer", "supplier"];

function getPortalsForRoles(roles) {
  const portals = new Set();
  roles.forEach((role) => {
    const portal = ROLE_PORTALS[role];
    if (portal) portals.add(portal);
  });
  return Array.from(portals);
}

function hasRole(userRoles, allowedRoles) {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.some((role) => allowedRoles.includes(role));
}

function hasPortal(userRoles, portal) {
  const portalRoleList = PORTAL_ROLES[portal];
  if (!portalRoleList) return false;
  return hasRole(userRoles, portalRoleList);
}

module.exports = {
  ROLE_PORTALS,
  PORTAL_ROLES,
  PORTAL_LABELS,
  PORTAL_DESCRIPTIONS,
  ALL_ROLES,
  SELF_REGISTER_ROLES,
  getPortalsForRoles,
  hasRole,
  hasPortal,
};
