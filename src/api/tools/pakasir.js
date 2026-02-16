const axios = require('axios');

class PakasirQR {
  async create(project, api_key, amount, method = "qris") {
    if (!project || !api_key || !amount) {
      throw { status: 400, message: "project, api_key, dan amount wajib diisi" };
    }

    const nominal = Number(amount);
    if (isNaN(nominal) || nominal < 1000) {
      throw { status: 400, message: "Minimum amount adalah 1000" };
    }

    const order_id = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const paymentUrl = `https://app.pakasir.com/pay/${project}/${nominal}?order_id=${order_id}`;

    try {
      const response = await axios.post(
        `https://app.pakasir.com/api/transactioncreate/${method}`,
        { project, order_id, amount: nominal, api_key },
        { headers: { "Content-Type": "application/json" }, timeout: 15000 }
      );

      if (!response?.data?.payment?.payment_number) {
        throw { status: 502, message: "QR atau payment info tidak ditemukan dari response Pakasir" };
      }

      return {
        amount: nominal,
        qr_string: response.data.payment.payment_number,
        transaction_id: response.data.payment.order_id,
        expired_at: response.data.payment.expired_at,
        payment_url: paymentUrl,
        payment_method: method
      };

    } catch (err) {
      console.error("Pakasir API Error:", err.response?.data || err.message);
      throw {
        status: err.response?.status || 500,
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Terjadi kesalahan saat menghubungi Pakasir"
      };
    }
  }
}

module.exports = function(app) {
  app.get("/tools/pakasir", async (req, res) => {
    try {
      const { project, api_key, amount, method } = req.query;
      // default method = qris
      const paymentMethod = method || "qris";

      const pakasir = new PakasirQR();
      const result = await pakasir.create(project, api_key, amount, paymentMethod);

      return res.status(200).json({
        status: true,
        creator: "Nayone API",
        result
      });
    } catch (err) {
      return res.status(err.status || 500).json({
        status: false,
        message: err.message
      });
    }
  });
};
