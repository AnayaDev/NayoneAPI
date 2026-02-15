const axios = require("axios");

class GempaBMKG {
  constructor() {
    this.latestUrl = "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json";
    this.listUrl = "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json";
  }

  formatGempa(g) {
    return {
      waktu: {
        tanggal: g.Tanggal,
        jam: g.Jam,
        dateTime: g.DateTime
      },
      lokasi: {
        wilayah: g.Wilayah,
        lintang: g.Lintang,
        bujur: g.Bujur,
        coordinates: g.Coordinates
      },
      kekuatan: {
        magnitude: parseFloat(g.Magnitude),
        kedalaman: g.Kedalaman,
        potensi: g.Potensi,
        dirasakan: g.Dirasakan || "-"
      },
      shakemap: g.Shakemap
        ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}`
        : null
    };
  }

  async getLatest() {
    const { data } = await axios.get(this.latestUrl);
    const gempa = data?.Infogempa?.gempa;
    if (!gempa) throw new Error("Data gempa tidak ditemukan");
    return this.formatGempa(gempa);
  }

  async getList(minMagnitude = 0, limit = 5) {
    const { data } = await axios.get(this.listUrl);
    const list = data?.Infogempa?.gempa || [];

    return list
      .filter(g => parseFloat(g.Magnitude) >= minMagnitude)
      .slice(0, limit)
      .map(g => this.formatGempa(g));
  }
}

module.exports = function(app) {

  app.get("/news/gempa", async (req, res) => {
    try {
      const { min, limit } = req.query;
      const scraper = new GempaBMKG();

      let result;

      if (min || limit) {
        result = await scraper.getList(
          parseFloat(min) || 0,
          parseInt(limit) || 5
        );
      } else {
        result = await scraper.getLatest();
      }

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
