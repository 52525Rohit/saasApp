const billingService = require("../../Model/PaymentModel/PaymentModel");
const { sendSuccess } = require("../../Utilities/response");

const getPlans = async (req, res) => {
  const plans = await billingService.getPlans();
  sendSuccess(res, plans, "Plans fetched");
};

const createCheckout = async (req, res) => {
  const { priceId, successUrl, cancelUrl } = req.body;
  const result = await billingService.createCheckoutSession(
    req.user.id,
    priceId,
    successUrl,
    cancelUrl,
  );
  sendSuccess(res, result, "Checkout session created");
};

const createPortal = async (req, res) => {
  const { returnUrl } = req.body;
  const result = await billingService.createPortalSession(
    req.user.id,
    returnUrl,
  );
  sendSuccess(res, result, "Portal session created");
};

const getSubscription = async (req, res) => {
  const subscription = await billingService.getSubscription(req.user.id);
  sendSuccess(res, subscription, "Subscription fetched");
};

const cancelSubscription = async (req, res) => {
  const subscription = await billingService.cancelSubscription(req.user.id);
  sendSuccess(res, subscription, "Subscription will cancel at period end");
};

// Raw body needed for Stripe signature verification
const webhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  await billingService.handleWebhook(req.body, signature);
  res.json({ received: true });
};

module.exports = {
  getPlans,
  createCheckout,
  createPortal,
  getSubscription,
  cancelSubscription,
  webhook,
};
