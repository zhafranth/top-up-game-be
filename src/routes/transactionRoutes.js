const express = require("express");
const {
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  createTransaction,
  initiateQrisPayment,
  handleZenospayWebhook,
} = require("../controllers/transactionController");
const { authenticateToken } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { updateTransactionSchema } = require("../validators/schemas");
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
router.get("/:id", getTransactionById);
router.put(
  "/:id",
  authenticateToken,
  validate(updateTransactionSchema),
  updateTransaction
);

// Public: initiate QRIS payment via Zenospay for a transaction
router.post("/:id/pay/qris", initiateQrisPayment);

// Public: Zenospay webhook endpoint
router.post("/webhook/zenospay", handleZenospayWebhook);

module.exports = router;
