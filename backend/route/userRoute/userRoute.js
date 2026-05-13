const router = require("express").Router();
const userController = require("../../Controller/AdminController/AdminController");
const {
  authenticate,
  requireAdmin,
} = require("../../middleware/AuthMiddleware");
const {
  updateProfileRules,
  validate,
} = require("../../middleware/ValidationMiddleware");
const { body } = require("express-validator");

// ─── Current User ─────────────────────────────────────────────────────────────
router.get("/profile", authenticate, userController.getProfile);
router.put(
  "/profile",
  authenticate,
  updateProfileRules,
  validate,
  userController.updateProfile,
);
router.get("/notifications", authenticate, userController.getNotifications);
router.put(
  "/notifications/read",
  authenticate,
  userController.markNotificationsRead,
);

// ─── Admin: Manage Users ──────────────────────────────────────────────────────
router.get("/", authenticate, requireAdmin, userController.getAllUsers);
router.put(
  "/:id/role",
  authenticate,
  requireAdmin,
  [
    body("role")
      .isIn(["USER", "MANAGER", "ADMIN", "SUPER_ADMIN"])
      .withMessage("Invalid role"),
    validate,
  ],
  userController.updateUserRole,
);
router.put(
  "/:id/toggle",
  authenticate,
  requireAdmin,
  userController.toggleUserStatus,
);
router.delete("/:id", authenticate, requireAdmin, userController.deleteUser);

module.exports = router;
