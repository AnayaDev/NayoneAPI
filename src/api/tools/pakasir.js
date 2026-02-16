const axios = require('axios')

class PakasirQR {
  async create(project, api_key, amount) {

    if (!project || !api_key || !amount) {
      throw {
        status: 400,
        message: "project, api_key, dan amount wajib diisi"
      }
    }

    const nominal = Number(amount)

    if (isNaN(nominal) || nominal < 1000) {
      throw {
        status: 400,
        message: "Minimum amount adalah 1000"
      }
    }

    try {
      const create = await axios.post(
        `https://app.pakasir.com/api/${project}/create-transaction`,
        { amount: nominal },
        {
          headers: {
            Authorization: `Bearer ${api_key}`,
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      )

      if (!create?.data?.qr_image) {
        throw {
          status: 502,
          message: "QR tidak ditemukan dari response Pakasir"
        }
      }

      return {
        amount: nominal,
        ...create.data
      }

    } catch (err) {
      throw {
        status: err.response?.status || 500,
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Terjadi kesalahan saat menghubungi Pakasir"
      }
    }
  }
}

module.exports = function(app) {

  app.get("/tools/pakasir", async (req, res) => {

    try {

      const { project, api_key, amount } = req.query

      const pakasir = new PakasirQR()
      const result = await pakasir.create(project, api_key, amount)

      return res.status(200).json({
        status: true,
        creator: "Nayone API",
        result
      })

    } catch (err) {

      return res.status(err.status || 500).json({
        status: false,
        message: err.message
      })

    }

  })

            }
