const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/tools/pakasir", async (req, res) => {
  try {
    const { project, api_key, amount } = req.body;

    // Validasi basic
    if (!project || !api_key || !amount) {
      return res.status(400).json({
        status: false,
        message: "project, api_key, dan amount wajib diisi",
      });
    }

    if (amount < 1000) {
      return res.status(400).json({
        status: false,
        message: "Minimum amount adalah 1000",
      });
    }

    // Request ke API Pakasir
    const create = await axios.post(
      `https://app.pakasir.com/api/${project}/create-transaction`,
      { amount },
      {
        headers: {
          Authorization: `Bearer ${api_key}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!create.data?.qr_image) {
      return res.status(500).json({
        status: false,
        message: "QR tidak ditemukan dari response Pakasir",
      });
    }

    // Ambil gambar QR sebagai buffer
    const qr = await axios.get(create.data.qr_image, {
      responseType: "arraybuffer",
    });

    // Kirim langsung sebagai PNG
    res.set({
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="qris-${Date.now()}.png"`,
    });

    return res.send(qr.data);

  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.response?.data?.message || err.message,
    });
  }
});

module.exports = router;
