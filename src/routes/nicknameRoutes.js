const express = require("express");
const { checkNickname } = require("../controllers/nicknameController");

const router = express.Router();

// Middleware untuk menaikkan timeout menjadi 2 menit (120 detik)
const setLongTimeout = (req, res, next) => {
  // Set timeout untuk response menjadi 2 menit (120000 ms)
  req.setTimeout(120000);
  res.setTimeout(120000);
  
  // Set keep-alive timeout di header response
  res.set('Keep-Alive', 'timeout=120');
  
  next();
};

/**
 * @swagger
 * /nickname/check:
 *   post:
 *     summary: Check nickname dari third-party API
 *     tags: [Nickname]
 *     parameters:
 *       - in: query
 *         name: target
 *         required: true
 *         schema:
 *           type: string
 *         description: Target ID untuk pengecekan nickname
 *     responses:
 *       200:
 *         description: Nickname berhasil ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Parameter target tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Target parameter is required"
 *       503:
 *         description: Service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Service unavailable"
 *                 message:
 *                   type: string
 *                   example: "Unable to connect to third-party service"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post("/check", setLongTimeout, checkNickname);

module.exports = router;
