const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const { prisma } = require("../../Config/database");
const config = require("../../Config/index");
const logger = require("../../Config/logger");

// ─────────────────────────────────────────────
// GOOGLE STRATEGY
// ─────────────────────────────────────────────
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
            // ✅ only use fields that exist in your schema
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName || profile.name?.givenName || "User",
                avatar: profile.photos?.[0]?.value,
                emailVerified: true,
              },
            });

            // create default org for new oauth user
            const org = await prisma.organization.create({
              data: {
                name: `${email.split("@")[0]}'s Workspace`,
                slug: `${email.split("@")[0]}-${Date.now()}`,
              },
            });

            await prisma.membership.create({
              data: {
                userId: user.id,
                organizationId: org.id,
                role: "OWNER",
              },
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
}

// ─────────────────────────────────────────────
// GITHUB STRATEGY
// ─────────────────────────────────────────────
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
          const email =
            profile.emails?.[0]?.value ||
            profile._json?.email ||
            `${profile.username}@github.local`;

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            // ✅ only use fields that exist in your schema
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName || profile.username || "User",
                avatar: profile.photos?.[0]?.value,
                emailVerified: true,
              },
            });

            const org = await prisma.organization.create({
              data: {
                name: `${email.split("@")[0]}'s Workspace`,
                slug: `${email.split("@")[0]}-${Date.now()}`,
              },
            });

            await prisma.membership.create({
              data: {
                userId: user.id,
                organizationId: org.id,
                role: "OWNER",
              },
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
}

module.exports = passport;
