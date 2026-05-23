const authService = require("../../Model/AuthModel/AuthModel");
const { sendSuccess, sendCreated } = require("../../Utilities/response");

const register = async (req, res) => {
  const user = await authService.register(req.body);
  sendCreated(res, user, "Registration successful. Please verify your email.");
};

const login = async (req, res) => {
  // ✅ removed req.ip and req.get("User-Agent") — not in schema
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, { user, accessToken }, "Login successful");
};

const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No refresh token" });
  }

  const tokens = await authService.refreshAccessToken(token);

  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, { accessToken: tokens.accessToken }, "Token refreshed");
};

const logout = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  await authService.logout(token);
  res.clearCookie("refreshToken");
  sendSuccess(res, null, "Logged out successfully");
};

const verifyEmail = async (req, res) => {
  await authService.verifyEmail(req.query.token);
  sendSuccess(res, null, "Email verified successfully");
};

const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body.email);
  sendSuccess(res, null, "If that email exists, a reset link has been sent");
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  sendSuccess(res, null, "Password reset successfully");
};

const changePassword = async (req, res) => {
  await authService.changePassword(
    req.user.id,
    req.body.currentPassword,
    req.body.newPassword,
  );
  sendSuccess(res, null, "Password changed successfully");
};

const me = async (req, res) => {
  sendSuccess(res, req.user, "User profile");
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
};
