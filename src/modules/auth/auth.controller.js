const authService = require("./auth.service");

exports.register = async (req, res, next) => {
  try { res.status(201).json(await authService.register(req.body)); } catch (error) { next(error); }
};
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    res.json(await authService.login(email, password));
  } catch (error) { next(error); }
};
exports.getMe = async (req, res, next) => {
  try { res.json(await authService.getMe(req.user.id)); } catch (error) { next(error); }
};
exports.socialAuth = async (req, res, next) => {
  try {
    const { idToken, roles } = req.body;
    res.status(201).json(await authService.socialAuth({ idToken, roles }));
  } catch (error) { next(error); }
};
