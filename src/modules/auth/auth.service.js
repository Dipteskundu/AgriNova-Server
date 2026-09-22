const jwt = require("jsonwebtoken");
const User = require("../../database/models/User");
const AppError = require("../../utils/AppError");

const SELF_REGISTER_ROLES = ["farmer", "buyer", "supplier"];

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

exports.register = async (userData) => {
  const { name, email, password, roles, role, phone } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  let assignedRoles = roles || [role || "farmer"];

  if (!Array.isArray(assignedRoles)) {
    assignedRoles = [assignedRoles];
  }

  const invalidRoles = assignedRoles.filter((r) => !SELF_REGISTER_ROLES.includes(r));
  if (invalidRoles.length > 0) {
    throw new AppError(
      `Cannot self-register with roles: ${invalidRoles.join(", ")}. Allowed: ${SELF_REGISTER_ROLES.join(", ")}`,
      400
    );
  }

  if (assignedRoles.length === 0) {
    assignedRoles = ["farmer"];
  }

  const user = await User.create({
    name,
    email,
    password,
    roles: assignedRoles,
    phone,
  });

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
    },
  };
};

exports.login = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
    },
  };
};

exports.getMe = async (userId) => {
  const user = await User.findById(userId).select("-password");
  return user;
};
