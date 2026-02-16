const axios = require('axios');

async function createPakasirQR(project, api_key, amount) {
    const nominal = Number(amount);

    if (!project || !api_key || !amount) {
        throw { status: 400, message: "project, api_key, dan amount wajib diisi" };
    }

    if (isNaN(nominal) || nominal < 1000) {
        throw { status: 400, message: "Minimum amount adalah 1000" };
    }

    const order_id = `INV-${Date.now()}`;
    const paymentUrl = `https://app.pakasir.com/pay/${project}/${nominal}?order_id=${order_id}`;

    const response = await axios.post(
        'https://app.pakasir.com/api/transactioncreate/qris',
        { project, order_id, amount: nominal, api_key },
        { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );

    if (!response?.data?.payment?.payment_number) {
        throw { status: 502, message: "QR tidak ditemukan dari response Pakasir" };
    }

    return {
        amount: nominal,
        qr_string: response.data.payment.payment_number,
        transaction_id: response.data.payment.order_id || order_id,
        expired_at: response.data.payment.expired_at || null,
        payment_url: paymentUrl
    };
}

module.exports = function (app) {
    app.get("/tools/pakasir", async (req, res) => {
        const { project, api_key, amount } = req.query;

        try {
            const result = await createPakasirQR(project, api_key, amount);
            return res.status(200).json({ status: true, result });
        } catch (err) {
            return res.status(err.status || 500).json({
                status: false,
                message: err.message || "Terjadi kesalahan saat menghubungi Pakasir"
            });
        }
    });
};
