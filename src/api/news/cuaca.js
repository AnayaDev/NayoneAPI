const axios = require("axios");

class CuacaBMKG {
  constructor() {
    this.baseUrl = "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=";
    this.wilayahUrl = "https://api.bmkg.go.id/publik/wilayah";
  }

  async findWilayahByName(namaWilayah) {
    const { data } = await axios.get(this.wilayahUrl);

    const wilayah = data?.data?.find(w =>
      w.kabupaten?.toLowerCase().includes(namaWilayah.toLowerCase()) ||
      w.kecamatan?.toLowerCase().includes(namaWilayah.toLowerCase())
    );

    if (!wilayah) throw new Error("Wilayah tidak ditemukan");

    return wilayah.id; // ini ADM4
  }

  async getCuacaByNama(namaWilayah = "Jakarta") {
    const adm4 = await this.findWilayahByName(namaWilayah);
    const { data } = await axios.get(this.baseUrl + adm4);

    const lokasi = data?.lokasi;
    const prakiraan = data?.data?.[0]?.cuaca?.[0]?.[0];

    if (!prakiraan) throw new Error("Data cuaca tidak tersedia");

    return {
      lokasi: {
        provinsi: lokasi?.provinsi,
        kabupaten: lokasi?.kabupaten,
        kecamatan: lokasi?.kecamatan,
        desa: lokasi?.desa
      },
      cuaca: {
        waktu: prakiraan.local_datetime,
        suhu: prakiraan.t + " °C",
        kelembapan: prakiraan.hu + " %",
        kondisi: prakiraan.weather_desc,
        kecepatan_angin: prakiraan.ws + " km/jam",
        arah_angin: prakiraan.wd,
        jarak_pandang: prakiraan.vs + " m"
      }
    };
  }
}

module.exports = function(app) {

  app.get("/news/cuaca", async (req, res) => {
    try {
      const { wilayah } = req.query;

      if (!wilayah) {
        return res.status(400).json({
          status: false,
          error: "Parameter wilayah wajib diisi"
        });
      }

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
