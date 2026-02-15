const axios = require("axios");

class JadwalSholat {

  async getTodaySholat(kota) {
    try {
      // Tanggal hari ini
      const today = new Date();
      const tanggal = today.toISOString().split("T")[0]; // format YYYY-MM-DD

      // Request API Aladhan
      const { data } = await axios.get("https://api.aladhan.com/v1/timingsByCity", {
        params: {
          city: kota,
          country: "Indonesia",
          method: 2,
          date: tanggal
        }
      });

      if (!data || !data.data) throw new Error("Data tidak ditemukan");

      const timings = data.data.timings;

      return {
        tanggal: data.data.date.gregorian.date,
        hijriyah: data.data.date.hijri.date,
        kota,
        imsak: timings.Imsak.split(" ")[0],
        subuh: timings.Fajr.split(" ")[0],
        dzuhur: timings.Dhuhr.split(" ")[0],
        ashar: timings.Asr.split(" ")[0],
        maghrib: timings.Maghrib.split(" ")[0],
        isya: timings.Isha.split(" ")[0]
      };

    } catch (err) {
      throw new Error("Gagal mengambil data dari Aladhan API: " + err.message);
    }
  }

}

module.exports = function(app) {

  app.get("/news/jadwalsholat", async (req, res) => {
    try {
      const kota = req.query.kota || "Jakarta";

      const service = new JadwalSholat();
      const result = await service.getTodaySholat(kota);

      res.status(200).json({
        status: true,
        creator: "Nayone API",
        source: "Aladhan API",
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
