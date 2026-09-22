const usersService = require("./users.service");

exports.getProfile = async (req, res, next) => {
  try {
    const user = await usersService.getProfile(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await usersService.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const user = await usersService.uploadAvatar(req.user.id, req.file);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
