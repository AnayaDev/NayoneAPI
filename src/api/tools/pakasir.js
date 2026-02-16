const axios = require('axios')

class PakasirQR {
  async create(project, api_key, amount) {

    if (!project || !api_key || !amount) {
      throw new Error("project, api_key, dan amount wajib diisi")
    }

    const nominal = Number(amount)

    if (isNaN(nominal) || nominal < 1000) {
      throw new Error("Minimum amount adalah 1000")
    }

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
      throw new Error("QR tidak ditemukan dari response Pakasir")
    }

    return {
      amount: nominal,
      ...create.data
    }
  }
}

module.exports = function(app) {

  app.get("/tools/pakasir", async (req, res) => {

    try {

      const { project, api_key, amount } = req.query

      const pakasir = new PakasirQR()
      const result = await pakasir.create(project, api_key, amount)

      res.status(200).json({
        status: true,
        creator: "Nayone API",
        result
      })

    } catch (err) {

      res.status(500).json({
        status: false,
        error: err.message
      })

    }

  })

      }
