const axios = require("axios");

class LiburNasional {

  async getLibur(tahun) {
    try {
      const { data } = await axios.get(
        `https://date.nager.at/api/v3/PublicHolidays/${tahun}/ID`
      );

      if (!Array.isArray(data)) {
        throw new Error("Format data tidak valid");
      }

      return data.map(item => ({
        tanggal: item.date,
        nama: item.localName,
        nama_internasional: item.name,
        tipe: "Libur Nasional",
        kategori: "tanggal_merah"
      }));

    } catch (err) {
      throw new Error("Gagal mengambil data dari Nager.Date");
    }
  }

  getCutiBersama(tahun) {
    const cuti = {
      2026: [
        { tanggal: "2026-03-23", nama: "Cuti Bersama Nyepi" },
        { tanggal: "2026-04-03", nama: "Cuti Bersama Idul Fitri" },
        { tanggal: "2026-12-24", nama: "Cuti Bersama Natal" }
      ]
    };

    if (!cuti[tahun]) return [];

    return cuti[tahun].map(item => ({
      tanggal: item.tanggal,
      nama: item.nama,
      nama_internasional: item.nama,
      tipe: "Cuti Bersama",
      kategori: "libur"
    }));
  }

}

module.exports = function(app) {

  app.get("/news/liburnasional", async (req, res) => {
    try {

      const bulanList = [
        "Januari","Februari","Maret","April","Mei","Juni",
        "Juli","Agustus","September","Oktober","November","Desember"
      ];

      const tahun = parseInt(req.query.tahun) || new Date().getFullYear();
      const bulan = req.query.bulan ? parseInt(req.query.bulan) : null;
      const tipe = req.query.tipe || "semua";
      const upcoming = req.query.upcoming === "true";

      if (bulan && (bulan < 1 || bulan > 12)) {
        return res.status(400).json({
          status: false,
          error: "Parameter bulan harus antara 1 - 12"
        });
      }

      const service = new LiburNasional();

      const nasional = await service.getLibur(tahun);
      const cuti = service.getCutiBersama(tahun);

      let result = [...nasional, ...cuti];

      // Filter bulan
      if (bulan) {
        result = result.filter(item =>
          new Date(item.tanggal).getMonth() + 1 === bulan
        );
      }

      // Filter tipe
      if (tipe === "merah") {
        result = result.filter(item =>
          item.kategori === "tanggal_merah"
        );
      }

      // Filter upcoming
      if (upcoming) {
        const today = new Date();
        today.setHours(0,0,0,0);
        result = result.filter(item =>
          new Date(item.tanggal) >= today
        );
      }

      result.sort((a, b) =>
        new Date(a.tanggal) - new Date(b.tanggal)
      );

      res.status(200).json({
        status: true,
        creator: "Nayone API",
        source: "Nager.Date + Cuti Bersama Manual",
        tahun,
        bulan: bulan ? bulanList[bulan - 1] : "Semua",
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
