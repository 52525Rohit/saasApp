const sendSuccess = (
  res,
  data,
  message = "Success",
  statusCode = 200,
  meta,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
};

const sendCreated = (res, data, message = "Created successfully") =>
  sendSuccess(res, data, message, 201);

const sendError = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
) => {
  return res.status(statusCode).json({ success: false, message });
};

const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page < Math.ceil(total / limit),
  hasPrev: page > 1,
});

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
  return { skip: (page - 1) * limit, take: limit, page, limit };
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
  buildPaginationMeta,
  getPaginationParams,
};
