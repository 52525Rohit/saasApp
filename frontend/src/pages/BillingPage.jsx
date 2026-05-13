import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";

export default function BillingPage() {
  const [subscription, setSubscription] = useState({
    status: "active",
    plan: "Pro",
    price: 29,
    nextBilling: "2024-06-15",
    cardLast4: "4242",
  });

  const [invoices, setInvoices] = useState([
    { id: 1, date: "2024-05-15", amount: 29, status: "paid" },
    { id: 2, date: "2024-04-15", amount: 29, status: "paid" },
    { id: 3, date: "2024-03-15", amount: 29, status: "paid" },
  ]);

  const handleCancelSubscription = () => {
    toast.success("Subscription cancelled successfully");
    setSubscription({ ...subscription, status: "cancelled" });
  };

  const handleDownloadInvoice = (invoiceId) => {
    toast.success("Invoice downloaded");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your subscription and payment methods
          </p>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Current Plan: {subscription.plan}
                </h2>
                <p className="text-blue-100 mt-1">
                  ${subscription.price}/month
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscription.status === "active"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {subscription.status === "active" ? "Active" : "Cancelled"}
              </div>
            </div>

            <div className="mt-4 flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Next billing: {subscription.nextBilling}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">
                  **** **** **** {subscription.cardLast4}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Upgrade Plan
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              Change Payment Method
            </button>
            {subscription.status === "active" && (
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Billing History
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`p-2 rounded-full ${
                    invoice.status === "paid" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {invoice.status === "paid" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Invoice #{invoice.id.toString().padStart(4, "0")}
                  </p>
                  <p className="text-sm text-gray-500">{invoice.date}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900">
                  ${invoice.amount}
                </span>
                <button
                  onClick={() => handleDownloadInvoice(invoice.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Payment Methods
          </h2>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  •••• •••• •••• {subscription.cardLast4}
                </p>
                <p className="text-sm text-gray-500">Expires 12/25</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-500">
                Edit
              </button>
              <button className="px-3 py-1 text-sm text-red-600 hover:text-red-500">
                Remove
              </button>
            </div>
          </div>

          <button className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Add Payment Method
          </button>
        </div>
      </div>
    </div>
  );
}
