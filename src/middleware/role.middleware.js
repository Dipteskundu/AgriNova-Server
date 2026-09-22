const role = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRoles = req.user.roles;

    if (!userRoles || !Array.isArray(userRoles)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const hasAccess = userRoles.some((r) => allowedRoles.includes(r));

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

module.exports = role;
