const { verifyAccessToken } = require("../Utilities/Jwt");
const { AppError } = require("../Utilities/appError");
const { prisma } = require("../Config/database");

const roleHierarchy = { SUPER_ADMIN: 4, ADMIN: 3, MANAGER: 2, USER: 1 };

// ─── Authenticate JWT ────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next(new AppError("No token provided", 401));
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (payload.type !== "access") {
      return next(new AppError("Invalid token type", 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true, // ✅ was firstName/lastName
        role: true,
        avatar: true,
        emailVerified: true, // ✅ was isEmailVerified
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new AppError("User not found or inactive", 401));
    }

    req.user = user;
    next();
  } catch (err) {
    next(new AppError("Invalid or expired token", 401));
  }
};

// ─── Role-Based Access Control ───────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError("Authentication required", 401));

    const hasPermission = roles.some(
      (role) => roleHierarchy[req.user.role] >= roleHierarchy[role],
    );

    if (!hasPermission)
      return next(new AppError("Insufficient permissions", 403));
    next();
  };
};

const requireAdmin = authorize("ADMIN");
const requireSuperAdmin = authorize("SUPER_ADMIN");
const requireManager = authorize("MANAGER");

// ─── Require Email Verified ──────────────────────────────────────────────────
const requireEmailVerified = (req, res, next) => {
  if (!req.user?.emailVerified) {
    // ✅ was isEmailVerified
    return next(new AppError("Please verify your email first", 403));
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireSuperAdmin,
  requireManager,
  requireEmailVerified,
};
