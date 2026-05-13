const path = require("path");

// Load .env file manually
require("dotenv").config({
  path: path.resolve(process.cwd(), ".env"),
});

const config = {
  env: process.env.NODE_ENV || "development",

  port: parseInt(process.env.PORT || "5000", 10),

  isDev: process.env.NODE_ENV !== "production",

  db: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:5000/api/v1/auth/google/callback",
    },

    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      callbackUrl:
        process.env.GITHUB_CALLBACK_URL ||
        "http://localhost:5000/api/v1/auth/github/callback",
    },
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",

    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",

    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",

    prices: {
      starter: process.env.STRIPE_PRICE_STARTER || "",
      pro: process.env.STRIPE_PRICE_PRO || "",
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || "",
    },
  },

  email: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",

    port: parseInt(process.env.SMTP_PORT || "587", 10),

    user: process.env.SMTP_USER || "",

    pass: process.env.SMTP_PASS || "",

    from: process.env.EMAIL_FROM || "noreply@saasapp.com",
  },

  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:5173",

    corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173").split(
      ",",
    ),
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),

    rateLimitWindowMs: parseInt(
      process.env.RATE_LIMIT_WINDOW_MS || "900000",
      10,
    ),

    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },
};

module.exports = config;
