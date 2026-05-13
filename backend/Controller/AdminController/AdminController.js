const userService = require("../../Model/AdminModel/AdminModel");
const { sendSuccess } = require("../../Utilities/response");

const getProfile = async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  sendSuccess(res, user, "Profile fetched");
};

const updateProfile = async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  sendSuccess(res, user, "Profile updated");
};

const getAllUsers = async (req, res) => {
  const { users, meta } = await userService.getAllUsers(req.query);
  sendSuccess(res, users, "Users fetched", 200, meta);
};

const updateUserRole = async (req, res) => {
  const user = await userService.updateUserRole(
    req.params.id,
    req.body.role,
    req.user.id,
  );
  sendSuccess(res, user, "Role updated");
};

const toggleUserStatus = async (req, res) => {
  const user = await userService.toggleUserStatus(req.params.id, req.user.id);
  sendSuccess(res, user, "Status updated");
};

const deleteUser = async (req, res) => {
  await userService.deleteUser(req.params.id, req.user.id);
  sendSuccess(res, null, "User deleted");
};

const getNotifications = async (req, res) => {
  const notifications = await userService.getNotifications(req.user.id);
  sendSuccess(res, notifications, "Notifications fetched");
};

const markNotificationsRead = async (req, res) => {
  await userService.markNotificationsRead(req.user.id);
  sendSuccess(res, null, "Notifications marked as read");
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getNotifications,
  markNotificationsRead,
};
