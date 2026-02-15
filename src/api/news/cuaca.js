const axios = require("axios");

class CuacaGlobal {
  async getCuaca(namaWilayah = "Jakarta") {

    // 1️⃣ Cari koordinat kota dulu
    const geo = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(namaWilayah)}&count=1`
    );

    if (!geo.data.results || geo.data.results.length === 0) {
      throw new Error("Wilayah tidak ditemukan");
    }

    const { latitude, longitude, name, country } = geo.data.results[0];

    // 2️⃣ Ambil cuaca current
    const weather = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );

    const current = weather.data.current_weather;

    return {
      lokasi: {
        nama: name,
        negara: country,
        latitude,
        longitude
      },
      cuaca: {
        waktu: current.time,
        suhu: current.temperature + " °C",
        kecepatan_angin: current.windspeed + " km/jam",
        arah_angin: current.winddirection + "°"
      }
    };
  }
}

module.exports = function(app) {

  app.get("/news/cuaca", async (req, res) => {
    try {

      const wilayah = req.query.wilayah || "Jakarta";

      const cuaca = new CuacaGlobal();
      const result = await cuaca.getCuaca(wilayah);

      res.status(200).json({
        status: true,
        creator: "Nayone API",
        source: "Open-Meteo",
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
