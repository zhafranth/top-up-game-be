const crypto = require("crypto");
const axios = require("axios");

/**
 * Zenospay Service
 * Notes: Adjust endpoint paths, headers, and exact signature/header names to Zenospay official docs.
 */
const ZENOS_BASE_URL = process.env.ZENOS_BASE_URL || "https://api.zenospay.com";
// Use PEM contents directly from environment variables (no file paths)
const ZENOS_PRIVATE_KEY_RAW = process.env.ZENOS_PRIVATE_KEY || "";
const ZENOS_PUBLIC_KEY_RAW = process.env.ZENOS_PUBLIC_KEY || "";
const ZENOS_PARTNER_ID = process.env.ZENOS_PARTNER_ID || "";
const ZENOS_WEBHOOK_DISABLE_VERIFY =
  String(process.env.ZENOS_WEBHOOK_DISABLE_VERIFY || "").toLowerCase() ===
  "true";
const ZENOS_WEBHOOK_ENDPOINT =
  process.env.ZENOS_WEBHOOK_ENDPOINT || "/api/transactions/webhook/zenospay";

function normalizePem(str) {
  return (str || "").replace(/\\n/g, "\n").trim();
}

const ZENOS_PRIVATE_KEY = normalizePem(ZENOS_PRIVATE_KEY_RAW);
const ZENOS_PUBLIC_KEY = normalizePem(ZENOS_PUBLIC_KEY_RAW);

// Example: create QRIS payment (align payload to user's sample)
async function createQrisPayment({
  referenceId,
  amount,
  noWaAsName,
  totalDiamond,
  description,
}) {
  const endpointPath = "/api/create/qris"; // adjust if different per Zenospay docs

  const payload = {
    merchant_transaction_id: referenceId,
    amount: String(amount),
    currency: "IDR",
    description: description || "Top Up",
    customer_name: noWaAsName, // gunakan no wa sebagai customer name
    product_name: String(totalDiamond), // gunakan total diamond sebagai product name
  };
  console.log("payload", payload);

  const timestamp = getTimestamp();
  const { signature } = generateSignature({
    method: "POST",
    endpointUrl: endpointPath,
    body: payload,
    timestamp,
  });

  const headers = {
    "Content-Type": "application/json",
    "X-TIMESTAMP": timestamp,
    "X-SIGNATURE": signature,
    "X-PARTNER-ID": ZENOS_PARTNER_ID || undefined,
  };

  const url = `${ZENOS_BASE_URL}${endpointPath}`;
  const { data } = await axios.post(url, payload, {
    headers: cleanHeaders(headers),
  });
  return data;
}

// Verify webhook signature using RSA public key provided
function verifyWebhook(headers, body) {
  try {
    if (ZENOS_WEBHOOK_DISABLE_VERIFY) return true;

    const signature =
      headers["x-signature"] ||
      headers["x-zenos-signature"] ||
      headers["zenos-signature"];
    const timestamp =
      headers["x-timestamp"] ||
      headers["x-zenos-timestamp"] ||
      headers["zenos-timestamp"];

    if (!signature || !timestamp) return false;

    // Build the same stringToSign: METHOD:URL:SHA256(payload):TIMESTAMP
    const method = "POST";
    const endpointUrl = ZENOS_WEBHOOK_ENDPOINT; // our configured callback path

    const payloadHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(body ?? {}, null, 0))
      .digest("hex")
      .toLowerCase();

    const stringToSign = [
      method.toUpperCase(),
      endpointUrl,
      payloadHash,
      String(timestamp),
    ].join(":");

    const publicKey = ZENOS_PUBLIC_KEY;
    if (!publicKey) {
      // Public key must be provided via env to verify webhook
      return false;
    }
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(stringToSign);
    const isValid = verifier.verify(publicKey, signature, "base64");
    return !!isValid;
  } catch (e) {
    return false;
  }
}

function generateSignature({ method, endpointUrl, body, timestamp }) {
  if (!ZENOS_PRIVATE_KEY) {
    throw new Error(
      "Private key not set. Provide PEM in ZENOS_PRIVATE_KEY environment variable."
    );
  }
  const privateKey = ZENOS_PRIVATE_KEY;

  const payloadHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(body ?? {}, null, 0))
    .digest("hex")
    .toLowerCase();

  const stringToSign = [
    method.toUpperCase(),
    endpointUrl,
    payloadHash,
    String(timestamp),
  ].join(":");

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(stringToSign);
  const signature = signer.sign(privateKey, "base64");

  return { signature, payloadHash, stringToSign };
}

function getTimestamp() {
  return Math.floor(Date.now() / 1000).toString();
}

function cleanHeaders(obj) {
  const o = { ...obj };
  Object.keys(o).forEach((k) => {
    if (o[k] === undefined || o[k] === null) delete o[k];
  });
  return o;
}

module.exports = {
  createQrisPayment,
  verifyWebhook,
};
