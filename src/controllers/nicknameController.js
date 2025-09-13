const axios = require("axios");

const checkNickname = async (req, res) => {
  try {
    const { target } = req.query;

    if (!target) {
      return res.status(400).json({ error: "Target parameter is required" });
    }

    const payload = {
      api_key: "Fk5RMK5r310zsxF6mEOUBYC3RLVYF4Tt",
      action: "get-nickname-game",
      layanan: "ROYALDREAM",
      target: 444666,
    };

    // console.log("payload", payload);
    const formData = new FormData();
    formData.append("api_key", "Fk5RMK5r310zsxF6mEOUBYC3RLVYF4Tt");
    formData.append("action", "get-nickname-game");
    formData.append("layanan", "ROYALDREAM");
    formData.append("target", "444666");

    const response = await axios.request({
      method: "POST",
      url: "https://ariepulsa.my.id/api/get-nickname-game",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      data: formData,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Check nickname error:", error);

    if (error.response) {
      // Third-party API error
      return res.status(error.response.status).json({
        error: "Third-party API error",
        message:
          error.response.data?.message || "Unknown error from third-party API",
      });
    }

    if (error.request) {
      // Network error
      return res.status(503).json({
        error: "Service unavailable",
        message: "Unable to connect to third-party service",
      });
    }

    // Other errors
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  checkNickname,
};
