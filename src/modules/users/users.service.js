const User = require("../../database/models/User");
const AppError = require("../../utils/AppError");

const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  roles: user.roles,
  phone: user.phone || "",
  address: user.address || "",
  profileImage: user.profileImage || "",
});

exports.getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return userResponse(user);
};

exports.updateProfile = async (userId, updates) => {
  const allowedFields = ["name", "phone", "address", "profileImage"];
  const filtered = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  const user = await User.findByIdAndUpdate(userId, filtered, { new: true });
  if (!user) throw new AppError("User not found", 404);
  return userResponse(user);
};

exports.uploadAvatar = async (userId, file) => {
  const cloudinary = require("../../config/cloudinary");

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "farmpath/avatars",
        public_id: `avatar_${userId}_${Date.now()}`,
        transformation: [{ width: 256, height: 256, crop: "fill" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });

  const user = await User.findByIdAndUpdate(
    userId,
    { profileImage: result.secure_url },
    { new: true }
  );
  if (!user) throw new AppError("User not found", 404);
  return userResponse(user);
};
