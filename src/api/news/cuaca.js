const axios = require("axios");

class CuacaBMKG {
  constructor() {
    this.url = "https://api.bmkg.go.id/publik/prakiraan-cuaca";
  }

  async getCuacaByNama(namaWilayah = "Jakarta") {
    const { data } = await axios.get(this.url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const wilayahMatch = data?.data?.find(w =>
      w.lokasi?.kabupaten?.toLowerCase().includes(namaWilayah.toLowerCase()) ||
      w.lokasi?.kecamatan?.toLowerCase().includes(namaWilayah.toLowerCase())
    );

    if (!wilayahMatch) {
      throw new Error("Wilayah tidak ditemukan");
    }

    const prakiraan = wilayahMatch?.cuaca?.[0]?.[0];
    if (!prakiraan) {
      throw new Error("Data cuaca tidak tersedia");
    }

    return {
      lokasi: {
        provinsi: wilayahMatch.lokasi.provinsi,
        kabupaten: wilayahMatch.lokasi.kabupaten,
        kecamatan: wilayahMatch.lokasi.kecamatan,
        desa: wilayahMatch.lokasi.desa
      },
      cuaca: {
        waktu: prakiraan.local_datetime,
        suhu: `${prakiraan.t} °C`,
        kelembapan: `${prakiraan.hu} %`,
        kondisi: prakiraan.weather_desc,
        kecepatan_angin: `${prakiraan.ws} km/jam`,
        arah_angin: prakiraan.wd,
        jarak_pandang: `${prakiraan.vs} m`
      }
    };
  }
}

module.exports = function(app) {

  app.get("/news/cuaca", async (req, res) => {
    try {

      const wilayah = req.query.wilayah || "Jakarta";

      const cuaca = new CuacaBMKG();
      const result = await cuaca.getCuacaByNama(wilayah);

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
