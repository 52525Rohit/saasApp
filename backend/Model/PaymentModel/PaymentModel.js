const Stripe = require("stripe");
const { prisma } = require("../../Config/database");
const config = require("../../Config/index");
const { AppError } = require("../../Utilities/appError");
const logger = require("../../Config/logger");

const stripe = new Stripe(config.stripe.secretKey);

// ─── Get or Create Stripe Customer ────────────────────────────────────────────
const getOrCreateCustomer = async (userId) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true },
  });

  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    metadata: { userId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { userId },
      data: { stripeCustomerId: customer.id },
    });
  }

  return customer.id;
};

// ─── Get Plans ────────────────────────────────────────────────────────────────
const getPlans = async () => {
  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
};

// ─── Create Checkout Session ──────────────────────────────────────────────────
const createCheckoutSession = async (
  userId,
  priceId,
  successUrl,
  cancelUrl,
) => {
  const customerId = await getOrCreateCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url:
      successUrl || `${config.frontend.url}/dashboard/billing?success=true`,
    cancel_url:
      cancelUrl || `${config.frontend.url}/dashboard/billing?canceled=true`,
    metadata: { userId },
    subscription_data: { trial_period_days: 14 },
    allow_promotion_codes: true,
  });

  return { url: session.url, sessionId: session.id };
};

// ─── Customer Portal ──────────────────────────────────────────────────────────
const createPortalSession = async (userId, returnUrl) => {
  const customerId = await getOrCreateCustomer(userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || `${config.frontend.url}/dashboard/billing`,
  });

  return { url: session.url };
};

// ─── Get Subscription ─────────────────────────────────────────────────────────
const getSubscription = async (userId) => {
  return prisma.subscription.findUnique({
    where: { userId },
    include: {
      plan: true,
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
};

// ─── Cancel Subscription ──────────────────────────────────────────────────────
const cancelSubscription = async (userId) => {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeSubscriptionId)
    throw new AppError("No active subscription found", 404);

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  return prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
    include: { plan: true },
  });
};

// ─── Stripe Webhook ───────────────────────────────────────────────────────────
const handleWebhook = async (rawBody, signature) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripe.webhookSecret,
    );
  } catch (err) {
    throw new AppError(
      `Webhook signature verification failed: ${err.message}`,
      400,
    );
  }

  logger.info(`Stripe webhook: ${event.type}`);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await syncSubscription(event.data.object);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;

    case "invoice.payment_succeeded":
      await handleInvoicePaid(event.data.object);
      break;

    case "invoice.payment_failed":
      await handleInvoiceFailed(event.data.object);
      break;

    default:
      logger.debug(`Unhandled Stripe event: ${event.type}`);
  }
};

const syncSubscription = async (stripeSubscription) => {
  const customerId = stripeSubscription.customer;
  const customer = await stripe.customers.retrieve(customerId);
  const userId = customer.metadata?.userId;
  if (!userId) return;

  const priceId = stripeSubscription.items.data[0]?.price?.id;
  const plan = await prisma.plan.findFirst({
    where: { stripePriceId: priceId },
  });

  const statusMap = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
  };

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      planId:
        plan?.id ||
        (await prisma.plan.findUnique({ where: { type: "FREE" } }))?.id,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: customerId,
      status: statusMap[stripeSubscription.status] || "INACTIVE",
      currentPeriodStart: new Date(
        stripeSubscription.current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialEnd: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
    update: {
      planId: plan?.id,
      stripeSubscriptionId: stripeSubscription.id,
      status: statusMap[stripeSubscription.status] || "INACTIVE",
      currentPeriodStart: new Date(
        stripeSubscription.current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialEnd: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
};

const handleSubscriptionDeleted = async (stripeSubscription) => {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubscription.id },
    data: { status: "CANCELED", canceledAt: new Date() },
  });
};

const handleInvoicePaid = async (invoice) => {
  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription },
  });
  if (!sub) return;

  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      subscriptionId: sub.id,
      stripeInvoiceId: invoice.id,
      number: invoice.number,
      status: "PAID",
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      paidAt: new Date(invoice.status_transitions.paid_at * 1000),
      invoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
    },
    update: {
      status: "PAID",
      paidAt: new Date(invoice.status_transitions.paid_at * 1000),
    },
  });
};

const handleInvoiceFailed = async (invoice) => {
  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription },
  });
  if (sub) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "PAST_DUE" },
    });
  }
};

module.exports = {
  getPlans,
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  cancelSubscription,
  handleWebhook,
};
