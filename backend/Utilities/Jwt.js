const jwt = require("jsonwebtoken");
const config = require("../Config/index");

const parseMs = (str) => {
  const unit = str.slice(-1);
  const val = parseInt(str.slice(0, -1), 10);
  const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return val * (map[unit] || 1000);
};

const generateAccessToken = (userId, email, role) => {
  return jwt.sign({ userId, email, role, type: "access" }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const generateRefreshToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role, type: "refresh" },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
    },
  );
};

const verifyAccessToken = (token) => jwt.verify(token, config.jwt.secret);

const verifyRefreshToken = (token) =>
  jwt.verify(token, config.jwt.refreshSecret);

const getTokenExpiry = (expiresIn) => new Date(Date.now() + parseMs(expiresIn));

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getTokenExpiry,
};
