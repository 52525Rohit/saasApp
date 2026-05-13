const router = require("express").Router();
const authController = require("../../Controller/AuthController/AuthController");
const { authenticate } = require("../../middleware/AuthMiddleware");
const {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
  validate,
} = require("../../middleware/ValidationMiddleware");
const passport = require("passport");
const config = require("../../Config/index");
const {
  generateAccessToken,
  generateRefreshToken,
  getTokenExpiry,
} = require("../../Utilities/Jwt");
const { prisma } = require("../../Config/database");

// ─── Standard Auth ────────────────────────────────────────────────────────────
router.post("/register", registerRules, validate, authController.register);
router.post("/login", loginRules, validate, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/verify-email", authController.verifyEmail);
router.post(
  "/forgot-password",
  forgotPasswordRules,
  validate,
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  resetPasswordRules,
  validate,
  authController.resetPassword,
);
router.post(
  "/change-password",
  authenticate,
  changePasswordRules,
  validate,
  authController.changePassword,
);
router.get("/me", authenticate, authController.me);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${config.frontend.url}/login?error=oauth`,
  }),
  oauthCallback,
);

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false }),
);
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${config.frontend.url}/login?error=oauth`,
  }),
  oauthCallback,
);

// Shared OAuth callback handler
async function oauthCallback(req, res) {
  const user = req.user;
  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id, user.email, user.role);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: getTokenExpiry("7d"),
    },
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.redirect(`${config.frontend.url}/oauth/callback?token=${accessToken}`);
}

module.exports = router;
