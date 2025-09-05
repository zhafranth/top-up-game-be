const express = require('express');
const {
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  createTransaction
} = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { updateTransactionSchema } = require('../validators/schemas');
const { z } = require('zod');

const router = express.Router();

// Create transaction schema for public endpoint
const createTransactionSchema = z.object({
  total_diamond: z.number().int().positive('Total diamond must be a positive integer'),
  total_amount: z.number().int().positive('Total amount must be a positive integer'),
  no_wa: z.string().min(1, 'WhatsApp number is required')
});

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Buat transaksi baru (Customer)
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - total_diamond
 *               - total_amount
 *               - no_wa
 *             properties:
 *               total_diamond:
 *                 type: integer
 *                 minimum: 1
 *                 description: Jumlah diamond yang dibeli
 *               total_amount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Total pembayaran
 *               no_wa:
 *                 type: string
 *                 description: Nomor WhatsApp customer
 *     responses:
 *       201:
 *         description: Transaksi berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validate(createTransactionSchema), createTransaction);

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get semua transaksi dengan pagination dan filter (Admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah item per halaman
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED]
 *         description: Filter berdasarkan status transaksi
 *     responses:
 *       200:
 *         description: List transaksi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticateToken, getAllTransactions);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get transaksi berdasarkan ID (Admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID transaksi
 *     responses:
 *       200:
 *         description: Detail transaksi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaksi tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update status transaksi (Admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID transaksi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, SUCCESS, FAILED]
 *                 description: Status transaksi baru
 *     responses:
 *       200:
 *         description: Transaksi berhasil diupdate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Transaksi tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticateToken, getTransactionById);
router.put('/:id', authenticateToken, validate(updateTransactionSchema), updateTransaction);

module.exports = router;