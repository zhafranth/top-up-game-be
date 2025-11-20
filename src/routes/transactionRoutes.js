const express = require("express");
const {
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  createTransaction,
  initiateQrisPayment,
  handleZenospayWebhook,
  updateTransactionByMerchantId,
  checkTransactionStatus,
} = require("../controllers/transactionController");
const { authenticateToken } = require("../middleware/auth");
const { validate, validateQuery } = require("../middleware/validation");
const {
  updateTransactionSchema,
  updateTransactionByMerchantSchema,
  checkTransactionStatusSchema,
} = require("../validators/schemas");
const { z } = require("zod");

const router = express.Router();

// Create transaction schema for public endpoint
const createTransactionSchema = z.object({
  total_diamond: z
    .number()
    .int()
    .positive("Total diamond must be a positive integer"),
  total_amount: z
    .number()
    .int()
    .positive("Total amount must be a positive integer"),
  no_wa: z.string().min(1, "WhatsApp number is required"),
  target_id: z.number().int().positive("Target ID must be a positive integer"),
});

// Public: create new transaction (no payment yet)
router.post("/", validate(createTransactionSchema), createTransaction);

// Admin: list, detail, update
router.get("/", authenticateToken, getAllTransactions);
router.get("/:id(d+)", getTransactionById);
router.put(
  "/:id",
  authenticateToken,
  validate(updateTransactionSchema),
  updateTransaction
);

// Endpoint baru: update status berdasarkan merchant_transaction_id
router.put(
  "/merchant/status",
  authenticateToken,
  validate(updateTransactionByMerchantSchema),
  updateTransactionByMerchantId
);

// Public: initiate QRIS payment via Zenospay for a transaction
router.post("/:id/pay/qris", initiateQrisPayment);

// Public: Zenospay webhook endpoint
router.post("/webhook/zenospay", handleZenospayWebhook);

// Public: cek status transaksi via query
router.get("/status", checkTransactionStatus);

module.exports = router;
