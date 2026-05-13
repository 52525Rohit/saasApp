const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { prisma } = require("../../Config/database");
const config = require("../../Config/index");
const { AppError } = require("../../Utilities/appError");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpiry,
} = require("../../Utilities/Jwt");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../../Utilities/email");
const logger = require("../../Config/logger");

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
const register = async ({ email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("Email already in use", 409);

  const hashed = await bcrypt.hash(password, config.security.bcryptRounds);

  // 1. Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashed,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  // 2. Create default organization
  const org = await prisma.organization.create({
    data: {
      name: `${email.split("@")[0]}'s Workspace`,
      slug: `${email.split("@")[0]}-${Date.now()}`,
    },
  });

  // 3. Create membership (OWNER)
  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: "OWNER",
    },
  });

  // 4. Email verification token
  const token = crypto.randomBytes(32).toString("hex");

  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  sendVerificationEmail(user.email, "User", token).catch((e) =>
    logger.error("Email error:", e),
  );

  return user;
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
const login = async ({ email, password }, ipAddress, userAgent) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      memberships: true,
    },
  });

  if (!user) throw new AppError("Invalid email or password", 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError("Invalid email or password", 401);

  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: getTokenExpiry(config.jwt.refreshExpiresIn),
      ipAddress,
      userAgent,
    },
  });

  const { passwordHash: _, ...safeUser } = user;

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
};

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────
const refreshAccessToken = async (token) => {
  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });

  if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
    throw new AppError("Refresh token expired or revoked", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) throw new AppError("User not found", 401);

  await prisma.refreshToken.update({
    where: { token },
    data: { isRevoked: true },
  });

  const newAccess = generateAccessToken(user.id, user.email);
  const newRefresh = generateRefreshToken(user.id, user.email);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: newRefresh,
      expiresAt: getTokenExpiry(config.jwt.refreshExpiresIn),
    },
  });

  return {
    accessToken: newAccess,
    refreshToken: newRefresh,
  };
};

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
const logout = async (token) => {
  if (!token) return;

  await prisma.refreshToken.updateMany({
    where: { token },
    data: { isRevoked: true },
  });
};

// ─────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────
const verifyEmail = async (token) => {
  const record = await prisma.emailVerification.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new AppError("Invalid or expired token", 400);
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
  });

  await prisma.emailVerification.delete({
    where: { token },
  });
};

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────
const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await sendPasswordResetEmail(user.email, "User", token);
};

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────
const resetPassword = async (token, newPassword) => {
  const record = await prisma.passwordReset.findUnique({ where: { token } });

  if (!record || record.isUsed || record.expiresAt < new Date()) {
    throw new AppError("Invalid or expired token", 400);
  }

  const hashed = await bcrypt.hash(newPassword, config.security.bcryptRounds);

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: hashed },
  });

  await prisma.passwordReset.update({
    where: { token },
    data: { isUsed: true },
  });

  await prisma.refreshToken.updateMany({
    where: { userId: record.userId },
    data: { isRevoked: true },
  });
};

// ─────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) throw new AppError("User not found", 404);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError("Incorrect current password", 400);

  const hashed = await bcrypt.hash(newPassword, config.security.bcryptRounds);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashed },
  });

  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
};

// ─────────────────────────────────────────────
module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
};
