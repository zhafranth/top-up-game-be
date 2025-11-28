const prisma = require("../utils/database");

// Helper: parse 'YYYY-MM-DD' into Date start-of-day (local time)
const parseDateOnly = (str) => {
  if (!str || typeof str !== "string") return null;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, yyyy, MM, dd] = m;
  const y = parseInt(yyyy, 10);
  const mon = parseInt(MM, 10) - 1; // zero-based month
  const d = parseInt(dd, 10);
  const date = new Date(y, mon, d, 0, 0, 0, 0);
  return isNaN(date.getTime()) ? null : date;
};

const endOfDay = (date) => {
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
};

const getDashboardStats = async (req, res) => {
  try {
    const { start, end } = req.query;

    // Validasi presence
    if (!start || !end) {
      return res.status(400).json({
        error: "Parameter 'start' dan 'end' wajib diisi",
      });
    }

    const startDateOnly = parseDateOnly(start);
    const endDateOnly = parseDateOnly(end);

    if (!startDateOnly) {
      return res.status(400).json({
        error: "Format 'start' tidak valid. Gunakan format YYYY-MM-DD",
      });
    }
    if (!endDateOnly) {
      return res.status(400).json({
        error: "Format 'end' tidak valid. Gunakan format YYYY-MM-DD",
      });
    }

    const startDate = new Date(
      startDateOnly.getFullYear(),
      startDateOnly.getMonth(),
      startDateOnly.getDate(),
      0,
      0,
      0,
      0
    );
    const endDate = endOfDay(endDateOnly);

    if (endDate < startDate) {
      return res.status(400).json({
        error: "Parameter 'end' harus lebih besar atau sama dengan 'start'",
      });
    }

    const where = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Total transaksi, income, profit
    const [totalTransactions, aggregate] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({
        where,
        _sum: { total_amount: true, actual_price: true },
      }),
    ]);

    const totalIncome = aggregate?._sum?.total_amount || 0;
    const totalProfit = aggregate?._sum?.actual_price || 0;

    // Ranking per produk (hanya transaksi yang memiliki product_id)
    const grouped = await prisma.transaction.groupBy({
      by: ["product_id"],
      where: { ...where, product_id: { not: null } },
      _count: { _all: true },
      _sum: { total_amount: true },
    });

    // Ambil nama produk sekali query
    const productIds = grouped.map((g) => g.product_id).filter((id) => id != null);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productNameMap = new Map(products.map((p) => [p.id, p.name]));

    const ranking_products = grouped
      .map((g) => ({
        name: productNameMap.get(g.product_id) || "Unknown",
        total_transaksi: g._count?._all || 0,
        total_pendapatan: g._sum?.total_amount || 0,
      }))
      .sort((a, b) => {
        if (b.total_transaksi !== a.total_transaksi) {
          return b.total_transaksi - a.total_transaksi;
        }
        return (b.total_pendapatan || 0) - (a.total_pendapatan || 0);
      });

    return res.json({
      ranking_products,
      total_transactions: totalTransactions,
      total_income: totalIncome,
      total_profit: totalProfit,
      range: { start, end },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getDashboardStats,
};