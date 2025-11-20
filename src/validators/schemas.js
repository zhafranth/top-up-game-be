const { z } = require('zod');

// Auth schemas
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'user']).optional()
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

// Product schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().int().positive('Price must be a positive integer'),
  discount: z.number().int().min(0).max(100).optional(),
  is_populer: z.boolean().optional(),
  total_diamond: z.number().int().positive('Total diamond must be a positive integer')
});

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  price: z.number().int().positive('Price must be a positive integer').optional(),
  discount: z.number().int().min(0).max(100).optional(),
  is_populer: z.boolean().optional(),
  total_diamond: z.number().int().positive('Total diamond must be a positive integer').optional()
});

// Transaction schemas
const updateTransactionSchema = z.object({
  status: z.enum(['pending', 'processing', 'success', 'failed'])
});

// Tambahan: update status berdasarkan merchant_transaction_id
const updateTransactionByMerchantSchema = z.object({
  merchant_transaction_id: z.string().min(1, 'merchant_transaction_id is required'),
  status: z.enum(['pending', 'processing', 'success', 'failed'])
});

// Tambahan: check status transaksi via query params
const checkTransactionStatusSchema = z.object({
  merchant_transaction_id: z.string().min(1, 'merchant_transaction_id is required'),
  no_wa: z.string().min(1, 'no_wa is required'),
});

// User schemas
const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'user']).optional()
});

const updateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['admin', 'user']).optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  createProductSchema,
  updateProductSchema,
  updateTransactionSchema,
  updateTransactionByMerchantSchema,
  checkTransactionStatusSchema,
  createUserSchema,
  updateUserSchema
};