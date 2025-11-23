const prisma = require("../utils/database");
const zenospayService = require("../services/zenospayService");
const { formatDate } = require("../utils/date");

const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, start, end } = req.query;
    const skip = (page - 1) * limit;

    // Helper: parse 'YYYY-MM-DD HH:mm:ss' into Date (local time)
    const parseDateTime = (str) => {
      if (!str || typeof str !== "string") return null;
      const m = str.match(
        /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/
      );
      if (!m) return null;
      const [, yyyy, MM, dd, HH, mm, ss] = m;
      const y = parseInt(yyyy, 10);
      const mon = parseInt(MM, 10) - 1; // zero-based
      const d = parseInt(dd, 10);
      const h = parseInt(HH, 10);
      const mi = parseInt(mm, 10);
      const s = parseInt(ss, 10);
      const date = new Date(y, mon, d, h, mi, s);
      return isNaN(date.getTime()) ? null : date;
    };

    const where = {};
    if (status) {
      where.status = status;
    }

    // Filter by created_at range using start/end
    let startDate = null;
    let endDate = null;
    if (start) {
      startDate = parseDateTime(start);
      if (!startDate) {
        return res.status(400).json({
          error: "Format 'start' tidak valid. Gunakan format YYYY-MM-DD HH:mm:ss",
        });
      }
    }
    if (end) {
      endDate = parseDateTime(end);
      if (!endDate) {
        return res.status(400).json({
          error: "Format 'end' tidak valid. Gunakan format YYYY-MM-DD HH:mm:ss",
        });
      }
    }
    if (startDate && endDate && endDate < startDate) {
      return res.status(400).json({
        error: "Parameter 'end' harus lebih besar atau sama dengan 'start'",
      });
    }
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = startDate;
      if (endDate) where.created_at.lte = endDate;
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

// Tambahan: Update status berdasarkan merchant_transaction_id
const updateTransactionByMerchantId = async (req, res) => {
  try {
    const { merchant_transaction_id, status } = req.body;

    // Validasi basic (tambahan selain Zod)
    if (
      !merchant_transaction_id ||
      typeof merchant_transaction_id !== "string"
    ) {
      return res
        .status(400)
        .json({ error: "merchant_transaction_id tidak ditemukan" });
    }
    if (!status) {
      return res.status(400).json({ error: "Status tidak ditemukan" });
    }

    // Cari transaksi berdasarkan merchant_transaction_id
    const existingTransaction = await prisma.transaction.findUnique({
      where: { merchant_transaction_id: String(merchant_transaction_id) },
    });

    if (!existingTransaction) {
      return res
        .status(404)
        .json({ error: "merchant_transaction_id tidak ditemukan" });
    }

    // Cek jika status sama
    if (existingTransaction.status === status) {
      return res
        .status(400)
        .json({ error: "Status baru sama dengan status saat ini" });
    }

    // Update status
    const updated = await prisma.transaction.update({
      where: { merchant_transaction_id: String(merchant_transaction_id) },
      data: { status },
    });

    return res.json({
      message: "Status transaksi berhasil diupdate",
      transaction: updated,
    });
  } catch (error) {
    console.error("Update transaction by merchant id error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Public endpoint for creating transactions (for customers)
const createTransaction = async (req, res) => {
  try {
    const { total_diamond, total_amount, no_wa, target_id } = req.body;

    const merchantRef = `TRX-${formatDate(
      new Date(),
      "DDMMYYYHHmmss"
    )}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const transaction = await prisma.transaction.create({
      data: {
        total_diamond,
        total_amount,
        no_wa,
        target_id,
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

    // Attempt to obtain our original reference and status from multiple possible fields
    const reference = payload.merchant_transaction_id;

    if (!reference) {
      return res
        .status(400)
        .json({ error: "Missing reference in webhook payload" });
    }

    // Update transaction status to processing
    await prisma.transaction.update({
      where: { merchant_transaction_id: String(reference) },
      data: { status: "processing" },
    });

    // Acknowledge webhook
    res.status(200).send("OK");
  } catch (error) {
    console.error("Zenospay webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Public: cek status transaksi berdasarkan merchant_transaction_id dan no_wa
const checkTransactionStatus = async (req, res) => {
  try {
    const { merchant_transaction_id, no_wa } = req.query;

    // Cari transaksi berdasarkan merchant_transaction_id (unik)
    const transaction = await prisma.transaction.findUnique({
      where: { merchant_transaction_id: String(merchant_transaction_id) },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaksi tidak ditemukan" });
    }

    // Pastikan no_wa sesuai
    if (String(transaction.no_wa) !== String(no_wa)) {
      return res.status(404).json({
        error:
          "Transaksi tidak ditemukan untuk merchant_transaction_id dan nomor telepon tersebut",
      });
    }

    return res.json({
      status: transaction.status,
      transaction: {
        id: transaction.id,
        merchant_transaction_id: transaction.merchant_transaction_id,
        no_wa: transaction.no_wa,
        total_diamond: transaction.total_diamond,
        total_amount: transaction.total_amount,
        target_id: transaction.target_id,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
      },
    });
  } catch (error) {
    console.error("Check transaction status error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  createTransaction,
  initiateQrisPayment,
  handleZenospayWebhook,
  updateTransactionByMerchantId,
  checkTransactionStatus,
};
