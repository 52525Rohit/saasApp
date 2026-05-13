const router = require("express").Router();
const billingController = require("../../Controller/PaymentController/PaymentController");
const { authenticate } = require("../../middleware/AuthMiddleware");
const express = require("express");

// Webhook needs raw body BEFORE express.json() parses it
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  billingController.webhook,
);

// Protected routes
router.get("/plans", billingController.getPlans);
router.get("/subscription", authenticate, billingController.getSubscription);
router.post("/checkout", authenticate, billingController.createCheckout);
router.post("/portal", authenticate, billingController.createPortal);
router.post("/cancel", authenticate, billingController.cancelSubscription);

module.exports = router;
