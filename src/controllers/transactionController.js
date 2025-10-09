const prisma = require("../utils/database");
const zenospayService = require("../services/zenospayService");

const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: {
        created_at: "desc",
      },
    });

    const total = await prisma.transaction.count({ where });

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ transaction });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const transaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    res.json({
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Public endpoint for creating transactions (for customers)
const createTransaction = async (req, res) => {
  try {
    const { total_diamond, total_amount, no_wa } = req.body;

    // Generate a unique merchant reference up to 64 chars
    const merchantRef = `TRX-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()}`;

    const transaction = await prisma.transaction.create({
      data: {
        total_diamond,
        total_amount,
        no_wa,
        status: "pending",
        merchant_transaction_id: merchantRef,
      },
    });

    res.status(201).json({
      message: "Transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Initiate QRIS payment via Zenospay for an existing transaction
const initiateQrisPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const trxId = parseInt(id);

    if (Number.isNaN(trxId)) {
      return res.status(400).json({ error: "Invalid transaction id" });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: trxId },
    });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.status === "success") {
      return res.status(400).json({ error: "Transaction already completed" });
    }

    // Use existing merchant reference if present; otherwise fallback to a predictable one
    const referenceId =
      transaction.merchant_transaction_id || `TRX-${transaction.id}`;

    // Call Zenospay to create QRIS payment
    const providerResponse = await zenospayService.createQrisPayment({
      referenceId,
      amount: transaction.total_amount,
      noWaAsName: transaction.no_wa,
      totalDiamond: transaction.total_diamond,
      description: `Top Up ${transaction.total_diamond} Diamonds`,
    });

    // Move transaction to processing state (do not overwrite merchant_transaction_id if already set)
    await prisma.transaction.update({
      where: { id: trxId },
      data: { status: "processing" },
    });

    // Try to extract common QR fields per provided sample
    const data = providerResponse?.data || providerResponse || {};
    const qris = {
      qr_string:
        data.qr_content || data.qrString || data.qr || data.qrCode || null,
      qr_url:
        data.qr_url || data.qrUrl || data.qr_code_url || data.codeUrl || null,
      redirect_url: data.redirect_url || null,
      transaction_id: data.transaction_id || null,
      raw: providerResponse,
    };

    res.status(200).json({
      message: "QRIS payment initiated",
      reference_id: referenceId,
      transaction_id: transaction.id,
      qris,
    });
  } catch (error) {
    console.error("Initiate QRIS error:", error?.response?.data || error);
    res.status(500).json({
      error: "Failed to initiate QRIS payment",
      detail: error?.response?.data || error?.message,
    });
  }
};

// Webhook handler for Zenospay notifications
const handleZenospayWebhook = async (req, res) => {
  try {
    // Optional basic verification (adjust according to Zenospay docs)
    const isVerified = zenospayService.verifyWebhook(req.headers, req.body);
    if (!isVerified) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const payload = req.body || {};

    console.log("payload", payload);

    // Attempt to obtain our original reference and status from multiple possible fields
    const reference = payload.merchant_transaction_id;

    console.log("reference", reference);

    if (!reference) {
      return res
        .status(400)
        .json({ error: "Missing reference in webhook payload" });
    }

    // Try to find transaction by our stored merchant_transaction_id first
    let trx = await prisma.transaction.findFirst({
      where: { merchant_transaction_id: String(reference) },
    });

    // If not found, extract numeric transaction id from reference like "TRX-123"
    let trxId = null;
    if (!trx) {
      const idMatch = String(reference).match(/(\d+)/);
      trxId = idMatch ? parseInt(idMatch[1]) : null;
      if (trxId) {
        trx = await prisma.transaction.findUnique({ where: { id: trxId } });
      }
    } else {
      trxId = trx.id;
    }

    if (!trxId) {
      return res.status(400).json({ error: "Invalid reference format" });
    }

    let newStatus = "processing";

    console.log("newStatus", newStatus);

    await prisma.transaction.update({
      where: { id: trxId },
      data: { status: "success" },
    });

    // Acknowledge webhook
    res.status(200).send("OK");
  } catch (error) {
    console.error("Zenospay webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  createTransaction,
  initiateQrisPayment,
  handleZenospayWebhook,
};
