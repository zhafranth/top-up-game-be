const axios = require("axios");

const checkNickname = async (req, res) => {
  try {
    // Ambil target dari query atau body
    const target = req.query.target || req.body.target;

    if (!target) {
      return res.status(400).json({ error: "Target parameter is required" });
    }

    // Siapkan data yang akan dikirim
    const apiKey = "Fk5RMK5r310zsxF6mEOUBYC3RLVYF4Tt";
    const action = "get-nickname-game";
    const layanan = "ROYALDREAM";
    
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
        url: "https://ariepulsa.my.id/api/game.php",
        data: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "User-Agent": "TopUpGames/1.0",
          "Origin": "https://topupgames.com",
          "Referer": "https://topupgames.com/"
        },
        timeout: 30000 // 30 seconds timeout
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
          target: target
        };
        
        response = await axios({
          method: "GET",
          url: "https://ariepulsa.my.id/api/game.php",
          params: params,
          headers: {
            "Accept": "application/json",
            "User-Agent": "TopUpGames/1.0"
          },
          timeout: 30000 // 30 seconds timeout
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
            target: target
          };
          
          response = await axios({
            method: "POST",
            url: "https://ariepulsa.my.id/api/game.php",
            data: jsonData,
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "User-Agent": "TopUpGames/1.0"
            },
            timeout: 30000 // 30 seconds timeout
          });
          
          // Jika POST dengan JSON berhasil, reset error
          error = null;
        } catch (jsonError) {
          console.log("POST method with JSON also failed:", jsonError.message);
          // Jika POST dengan JSON juga gagal, coba dengan metode GET dengan parameter di URL
          try {
            console.log("Trying GET method with direct URL parameters...");
            
            // Buat URL dengan parameter langsung
            const url = `https://ariepulsa.my.id/api/game.php?api_key=${encodeURIComponent(apiKey)}&action=${encodeURIComponent(action)}&layanan=${encodeURIComponent(layanan)}&target=${encodeURIComponent(target)}`;
            
            response = await axios({
              method: "GET",
              url: url,
              headers: {
                "Accept": "application/json",
                "User-Agent": "TopUpGames/1.0",
                "Cache-Control": "no-cache"
              },
              timeout: 30000 // 30 seconds timeout
            });
            
            // Jika GET dengan URL parameter berhasil, reset error
            error = null;
          } catch (urlError) {
            console.log("GET method with direct URL parameters also failed:", urlError.message);
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
        return res.status(error.response.status).json({
          error: "Third-party API error",
          message: error.response.data?.message || "Unknown error from third-party API",
          details: `Status code: ${error.response.status}`,
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
      
      // Other errors
      return res.status(500).json({ 
        error: "Internal server error",
        details: error.message 
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
