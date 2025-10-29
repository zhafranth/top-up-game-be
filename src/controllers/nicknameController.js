const axios = require("axios");

const checkNickname = async (req, res) => {
  try {
    // Ambil target dari query atau body
    const target = req.query.target || req.body.target;

    if (!target) {
      return res.status(400).json({ error: "Target parameter is required" });
    }

    // Siapkan data yang akan dikirim
    const apiKey = "3JBBuWXnR8rpPTutkhvtPoX2hY8lc4WH";
    const action = "get-nickname-game";
    const layanan = "ROYALDREAM";

    console.log("apiKey:", apiKey);
    console.log("action:", action);
    console.log("layanan:", layanan);

    // Log informasi request
    console.log("Checking nickname for target:", target);

    let response;
    let error;

    // Coba dengan metode POST terlebih dahulu
    try {
      console.log("Trying POST method with form-urlencoded data...");

      const formData = new URLSearchParams();
      formData.append("api_key", apiKey);
      formData.append("action", action);
      formData.append("layanan", layanan);
      formData.append("target", target);

      response = await axios({
        method: "POST",
        url: "https://ariepulsa.my.id/api/get-nickname-game",
        data: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "TopUpGames/1.0",
          Origin: "https://topupgames.com",
          Referer: "https://topupgames.com/",
        },
        timeout: 30000, // 30 seconds timeout
      });
    } catch (postError) {
      console.log("POST method failed:", postError.message);
      error = postError;

      // Jika POST gagal, coba dengan metode GET
      try {
        console.log("Trying GET method with query parameters...");

        const params = {
          api_key: apiKey,
          action: action,
          layanan: layanan,
          target: target,
        };

        response = await axios({
          method: "GET",
          url: "https://ariepulsa.my.id/api/game.php",
          params: params,
          headers: {
            Accept: "application/json",
            "User-Agent": "TopUpGames/1.0",
          },
          timeout: 30000, // 30 seconds timeout
        });

        // Jika GET berhasil, reset error
        error = null;
      } catch (getError) {
        console.log("GET method also failed:", getError.message);

        // Jika GET juga gagal, coba dengan metode POST dengan JSON data
        try {
          console.log("Trying POST method with JSON data...");

          const jsonData = {
            api_key: apiKey,
            action: action,
            layanan: layanan,
            target: target,
          };

          response = await axios({
            method: "POST",
            url: "https://ariepulsa.my.id/api/get-nickname-game",
            data: jsonData,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "User-Agent": "TopUpGames/1.0",
            },
            timeout: 30000, // 30 seconds timeout
          });

          // Jika POST dengan JSON berhasil, reset error
          error = null;
        } catch (jsonError) {
          console.log("POST method with JSON also failed:", jsonError.message);
          // Jika POST dengan JSON juga gagal, coba dengan metode GET dengan parameter di URL
          try {
            console.log("Trying GET method with direct URL parameters...");

            // Buat URL dengan parameter langsung
            const url = `https://ariepulsa.my.id/api/game.php?api_key=${encodeURIComponent(
              apiKey
            )}&action=${encodeURIComponent(
              action
            )}&layanan=${encodeURIComponent(
              layanan
            )}&target=${encodeURIComponent(target)}`;

            response = await axios({
              method: "GET",
              url: url,
              headers: {
                Accept: "application/json",
                "User-Agent": "TopUpGames/1.0",
                "Cache-Control": "no-cache",
              },
              timeout: 30000, // 30 seconds timeout
            });

            // Jika GET dengan URL parameter berhasil, reset error
            error = null;
          } catch (urlError) {
            console.log(
              "GET method with direct URL parameters also failed:",
              urlError.message
            );
            // Tetap gunakan error dari POST pertama jika semua metode gagal
          }
        }
      }
    }

    // Jika ada response, kirim data response
    if (response) {
      console.log("Request successful, returning data");
      return res.json(response.data);
    }

    // Jika tidak ada response tapi ada error, berarti kedua metode gagal
    if (error) {
      console.error("Both request methods failed");

      if (error.response) {
        // Third-party API error
        console.error("Third-party API error details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        });

        // Jika status 401, kemungkinan masalah dengan API key
        if (error.response.status === 401) {
          return res.status(401).json({
            error: "API Authentication Failed",
            message:
              "Autentikasi ke API eksternal gagal. Kemungkinan API key tidak valid atau sudah kadaluarsa.",
            details: {
              status: error.response.status,
              data: error.response.data || {},
              suggestion:
                "Periksa kembali API key dan pastikan masih valid. Jika perlu, minta API key baru dari penyedia API.",
            },
          });
        }

        // Jika status 403, kemungkinan masalah dengan IP whitelist
        if (error.response.status === 403) {
          return res.status(403).json({
            error: "API Access Forbidden",
            message:
              "Akses ke API eksternal ditolak. Kemungkinan penyebab: IP server tidak di-whitelist atau format request tidak sesuai.",
            details: {
              status: error.response.status,
              data: error.response.data || {},
              suggestion:
                "Pastikan IP server sudah di-whitelist oleh penyedia API. Jika sudah, coba hubungi penyedia API untuk informasi lebih lanjut.",
            },
          });
        }

        // Jika status 400, kemungkinan format request tidak sesuai
        if (error.response.status === 400) {
          return res.status(400).json({
            error: "Invalid Request Format",
            message:
              "Format request ke API eksternal tidak valid. Parameter atau nilai yang dikirim mungkin tidak sesuai dengan yang diharapkan.",
            details: {
              status: error.response.status,
              data: error.response.data || {},
              suggestion:
                "Periksa dokumentasi API untuk memastikan format request yang benar. Pastikan semua parameter wajib sudah disertakan dengan nilai yang valid.",
            },
          });
        }

        // Jika status 429, terlalu banyak request
        if (error.response.status === 429) {
          return res.status(429).json({
            error: "Rate Limit Exceeded",
            message:
              "Terlalu banyak request ke API eksternal dalam waktu singkat. Harap coba lagi nanti.",
            details: {
              status: error.response.status,
              data: error.response.data || {},
              suggestion:
                "Tunggu beberapa saat sebelum mencoba kembali. Pertimbangkan untuk mengurangi frekuensi request ke API.",
            },
          });
        }

        // Jika status 500, error internal dari API eksternal
        if (error.response.status === 500) {
          return res.status(502).json({
            error: "External API Server Error",
            message:
              "API eksternal mengalami masalah internal. Ini bukan kesalahan dari aplikasi kita.",
            details: {
              status: error.response.status,
              data: error.response.data || {},
              suggestion:
                "Coba lagi nanti. Jika masalah berlanjut, hubungi penyedia API untuk informasi lebih lanjut.",
            },
          });
        }

        // Jika status 404, endpoint atau resource tidak ditemukan
        if (error.response.status === 404) {
          return res.status(404).json({
            error: "Resource Not Found",
            message: "Endpoint API atau resource yang diminta tidak ditemukan.",
            details: {
              status: error.response.status,
              data: error.response.data || {},
              suggestion:
                "Periksa kembali URL endpoint API dan parameter yang digunakan. Pastikan endpoint masih tersedia di dokumentasi API terbaru.",
            },
          });
        }

        // Jika status 502, bad gateway
        if (error.response.status === 502) {
          return res.status(502).json({
            error: "Bad Gateway",
            message:
              "Server API eksternal tidak dapat dijangkau atau tidak merespons dengan benar.",
            details: {
              status: error.response.status,
              data: error.response.data || {},
              suggestion:
                "Coba lagi nanti. Kemungkinan ada masalah jaringan atau server API eksternal sedang down.",
            },
          });
        }

        // Jika status 504, gateway timeout
        if (error.response.status === 504) {
          return res.status(504).json({
            error: "Gateway Timeout",
            message:
              "Server API eksternal tidak merespons dalam waktu yang ditentukan.",
            details: {
              status: error.response.status,
              data: error.response.data || {},
              suggestion:
                "Coba lagi nanti. Server API eksternal mungkin sedang sibuk atau ada masalah jaringan.",
            },
          });
        }

        // Log error response untuk debugging
        console.log("Third-party API error details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        });

        return res.status(error.response.status).json({
          error: "Third-party API error",
          message:
            error.response.data?.message ||
            "Unknown error from third-party API",
          details: {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data || {},
            endpoint: error.config?.url || "unknown",
            method: error.config?.method?.toUpperCase() || "unknown",
          },
        });
      }

      if (error.request) {
        // Network error
        return res.status(503).json({
          error: "Service unavailable",
          message: "Unable to connect to third-party service",
          details: error.message,
        });
      }

      if (error.code === "ECONNABORTED") {
        // Timeout error
        console.log("Timeout error details:", {
          code: error.code,
          message: error.message,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            timeout: error.config?.timeout,
          },
        });

        return res.status(504).json({
          error: "Gateway Timeout",
          message:
            "Request timeout. API eksternal tidak merespons dalam waktu yang ditentukan (30 detik).",
          details: {
            code: error.code,
            suggestion:
              "Coba lagi nanti. Server API eksternal mungkin sedang sibuk atau ada masalah jaringan.",
          },
        });
      } else if (error.code === "ECONNREFUSED") {
        // Connection refused error
        console.log("Connection refused error details:", {
          code: error.code,
          message: error.message,
          config: {
            url: error.config?.url,
            method: error.config?.method,
          },
        });

        return res.status(503).json({
          error: "Service Unavailable",
          message:
            "Koneksi ke API eksternal ditolak. Server API mungkin sedang down atau tidak menerima koneksi.",
          details: {
            code: error.code,
            suggestion:
              "Coba lagi nanti. Jika masalah berlanjut, hubungi penyedia API.",
          },
        });
      } else if (error.code === "ENOTFOUND") {
        // DNS resolution failed
        console.log("DNS resolution failed error details:", {
          code: error.code,
          message: error.message,
          config: {
            url: error.config?.url,
            method: error.config?.method,
          },
        });

        return res.status(503).json({
          error: "Service Unavailable",
          message:
            "Domain API eksternal tidak dapat ditemukan. Kemungkinan ada masalah DNS atau domain tidak valid.",
          details: {
            code: error.code,
            suggestion:
              "Periksa kembali URL API. Jika URL sudah benar, kemungkinan ada masalah dengan DNS atau server domain.",
          },
        });
      } else if (
        error.code === "ETIMEDOUT" ||
        error.code === "ESOCKETTIMEDOUT"
      ) {
        // Connection timeout
        console.log("Connection timeout error details:", {
          code: error.code,
          message: error.message,
          config: {
            url: error.config?.url,
            method: error.config?.method,
          },
        });

        return res.status(504).json({
          error: "Gateway Timeout",
          message:
            "Koneksi ke API eksternal timeout. Server tidak merespons dalam waktu yang ditentukan.",
          details: {
            code: error.code,
            suggestion:
              "Coba lagi nanti. Server API eksternal mungkin sedang sibuk atau ada masalah jaringan.",
          },
        });
      }

      // Other errors
      return res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
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
