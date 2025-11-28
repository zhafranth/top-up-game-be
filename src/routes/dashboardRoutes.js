const express = require("express");
const { getDashboardStats } = require("../controllers/dashboardController");
const { validateQuery } = require("../middleware/validation");
const { z } = require("zod");

const router = express.Router();

// Validasi query params: start dan end wajib dengan format YYYY-MM-DD
const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
const dashboardQuerySchema = z.object({
  start: z.string().min(1, "start wajib diisi").regex(dateRegex, "format start harus YYYY-MM-DD"),
  end: z.string().min(1, "end wajib diisi").regex(dateRegex, "format end harus YYYY-MM-DD"),
});

// GET /dashboard?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get("/", validateQuery(dashboardQuerySchema), getDashboardStats);

module.exports = router;