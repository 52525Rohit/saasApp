const { prisma } = require("../../Config/database");
const { AppError } = require("../../Utilities/appError");
const {
  getPaginationParams,
  buildPaginationMeta,
} = require("../../Utilities/response");

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
      lastLoginAt: true,
      subscription: {
        include: { plan: true },
      },
    },
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const updateProfile = async (userId, data) => {
  const allowed = {};
  if (data.firstName) allowed.firstName = data.firstName;
  if (data.lastName) allowed.lastName = data.lastName;
  if (data.avatar) allowed.avatar = data.avatar;

  return prisma.user.update({
    where: { id: userId },
    data: allowed,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
    },
  });
};

const getAllUsers = async (query) => {
  const { skip, take, page, limit } = getPaginationParams(query);
  const where = {};
  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: "insensitive" } },
      { firstName: { contains: query.search, mode: "insensitive" } },
      { lastName: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.role) where.role = query.role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, meta: buildPaginationMeta(total, page, limit) };
};

const updateUserRole = async (targetId, role, requesterId) => {
  if (targetId === requesterId)
    throw new AppError("Cannot change your own role", 400);
  return prisma.user.update({
    where: { id: targetId },
    data: { role },
    select: { id: true, email: true, role: true },
  });
};

const toggleUserStatus = async (targetId, requesterId) => {
  if (targetId === requesterId)
    throw new AppError("Cannot deactivate yourself", 400);
  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user) throw new AppError("User not found", 404);
  return prisma.user.update({
    where: { id: targetId },
    data: { isActive: !user.isActive },
    select: { id: true, email: true, isActive: true },
  });
};

const deleteUser = async (targetId, requesterId) => {
  if (targetId === requesterId)
    throw new AppError("Cannot delete yourself", 400);
  await prisma.user.delete({ where: { id: targetId } });
};

const getNotifications = async (userId) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
};

const markNotificationsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
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
