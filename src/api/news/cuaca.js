const axios = require("axios");

class CuacaBMKG {
  constructor() {
    this.baseUrl = "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=";
  }

  async getCuaca(wilayah = "31.71.01.1001") {
    // default kode adm4 Jakarta Pusat
    const { data } = await axios.get(this.baseUrl + wilayah);

    const lokasi = data?.lokasi;
    const prakiraan = data?.data?.[0]?.cuaca?.[0]?.[0];

    if (!prakiraan) throw new Error("Data cuaca tidak ditemukan");

    return {
      lokasi: {
        provinsi: lokasi?.provinsi,
        kabupaten: lokasi?.kabupaten,
        kecamatan: lokasi?.kecamatan,
        desa: lokasi?.desa
      },
      cuaca: {
        waktu: prakiraan.local_datetime,
        suhu: prakiraan.t,
        kelembapan: prakiraan.hu,
        kondisi: prakiraan.weather_desc,
        kecepatan_angin: prakiraan.ws,
        arah_angin: prakiraan.wd,
        jarak_pandang: prakiraan.vs
      }
    };
  }
}

module.exports = function(app) {

  app.get("/news/cuaca", async (req, res) => {
    try {
      const { wilayah } = req.query;
      const cuaca = new CuacaBMKG();
      const result = await cuaca.getCuaca(wilayah);

      res.status(200).json({
        status: true,
        creator: "Nayone API",
        source: "BMKG",
        result
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};
