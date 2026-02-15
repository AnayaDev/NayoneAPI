const axios = require("axios");

class JadwalPuasa {

  async detectRamadanMonth(tahun, kota) {

    for (let month = 1; month <= 12; month++) {

      const { data } = await axios.get(
        "https://api.aladhan.com/v1/calendarByCity",
        {
          params: {
            city: kota,
            country: "Indonesia",
            method: 2,
            month,
            year: tahun
          }
        }
      );

      const isRamadan = data.data.some(
        d => d.date.hijri.month.number === 9
      );

      if (isRamadan) return month;
    }

    throw new Error("Ramadan tidak ditemukan");
  }

  async getRamadanSchedule(kota, bulan, tahun) {

    const { data } = await axios.get(
      "https://api.aladhan.com/v1/calendarByCity",
      {
        params: {
          city: kota,
          country: "Indonesia",
          method: 2,
          month: bulan,
          year: tahun
        }
      }
    );

    return data.data
      .filter(d => d.date.hijri.month.number === 9)
      .map(item => ({
        tanggal_masehi: item.date.gregorian.date,
        tanggal_hijriyah: item.date.hijri.date,
        imsak: item.timings.Imsak.split(" ")[0],
        subuh: item.timings.Fajr.split(" ")[0],
        maghrib: item.timings.Maghrib.split(" ")[0],
        buka_puasa: item.timings.Maghrib.split(" ")[0]
      }));
  }

}

module.exports = function(app) {

  app.get("/news/jadwalpuasa", async (req, res) => {
    try {

      const kota = req.query.kota || "Jakarta";
      const tahun = parseInt(req.query.tahun) || new Date().getFullYear();
      const todayOnly = req.query.today === "true";

      const service = new JadwalPuasa();

      // Auto detect Ramadan month
      const bulanRamadan = await service.detectRamadanMonth(tahun, kota);

      const schedule = await service.getRamadanSchedule(
        kota,
        bulanRamadan,
        tahun
      );

      let result = schedule;

      if (todayOnly) {
        const today = new Date();
        const formatted =
          ("0" + today.getDate()).slice(-2) + "-" +
          ("0" + (today.getMonth() + 1)).slice(-2) + "-" +
          today.getFullYear();

        result = schedule.filter(
          r => r.tanggal_masehi === formatted
        );
      }

      res.status(200).json({
        status: true,
        creator: "Nayone API",
        source: "Aladhan API",
        kota,
        tahun,
        ramadan_bulan_masehi: bulanRamadan,
        total: result.length,
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
