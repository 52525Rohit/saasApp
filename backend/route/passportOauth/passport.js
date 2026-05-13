const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const { prisma } = require("../../Config/database");
const config = require("../../Config/index");
const logger = require("../../Config/logger");

// ─── Google OAuth ─────────────────────────────────────────────────────────────
if (config.oauth.google.clientId && config.oauth.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.callbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google"), null);

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                firstName: profile.name?.givenName || "User",
                lastName: profile.name?.familyName || "",
                avatar: profile.photos?.[0]?.value,
                isEmailVerified: true,
                oauthAccounts: {
                  create: {
                    provider: "GOOGLE",
                    providerId: profile.id,
                    accessToken,
                  },
                },
              },
            });

            // Assign free plan
            const freePlan = await prisma.plan.findUnique({
              where: { type: "FREE" },
            });
            if (freePlan) {
              await prisma.subscription.create({
                data: {
                  userId: user.id,
                  planId: freePlan.id,
                  status: "ACTIVE",
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
                },
              });
            }
          } else {
            // Upsert OAuth account
            await prisma.oAuthAccount.upsert({
              where: {
                provider_providerId: {
                  provider: "GOOGLE",
                  providerId: profile.id,
                },
              },
              create: {
                userId: user.id,
                provider: "GOOGLE",
                providerId: profile.id,
                accessToken,
              },
              update: { accessToken },
            });
          }

          return done(null, user);
        } catch (err) {
          logger.error("Google OAuth error:", err);
          return done(err, null);
        }
      },
    ),
  );
} else {
  logger.warn(
    "Google OAuth is disabled because GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set.",
  );
}

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────
if (config.oauth.github.clientId && config.oauth.github.clientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.oauth.github.clientId,
        clientSecret: config.oauth.github.clientSecret,
        callbackURL: config.oauth.github.callbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email)
            return done(
              new Error(
                "No email from GitHub. Enable email visibility in GitHub settings.",
              ),
              null,
            );

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            const nameParts = (
              profile.displayName ||
              profile.username ||
              "User"
            ).split(" ");
            user = await prisma.user.create({
              data: {
                email,
                firstName: nameParts[0] || "User",
                lastName: nameParts.slice(1).join(" ") || "",
                avatar: profile.photos?.[0]?.value,
                isEmailVerified: true,
                oauthAccounts: {
                  create: {
                    provider: "GITHUB",
                    providerId: String(profile.id),
                    accessToken,
                  },
                },
              },
            });

            const freePlan = await prisma.plan.findUnique({
              where: { type: "FREE" },
            });
            if (freePlan) {
              await prisma.subscription.create({
                data: {
                  userId: user.id,
                  planId: freePlan.id,
                  status: "ACTIVE",
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
                },
              });
            }
          } else {
            await prisma.oAuthAccount.upsert({
              where: {
                provider_providerId: {
                  provider: "GITHUB",
                  providerId: String(profile.id),
                },
              },
              create: {
                userId: user.id,
                provider: "GITHUB",
                providerId: String(profile.id),
                accessToken,
              },
              update: { accessToken },
            });
          }

          return done(null, user);
        } catch (err) {
          logger.error("GitHub OAuth error:", err);
          return done(err, null);
        }
      },
    ),
  );
} else {
  logger.warn(
    "GitHub OAuth is disabled because GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not set.",
  );
}

module.exports = passport;
