const axios = require("axios");
const cheerio = require("cheerio");

class AnimeScraper {
  constructor() {
    this.baseURL = "https://s9.nontonanimeid.boats";
  }

  async search(query) {
    try {
      if (!query) {
        throw new Error("Query is required");
      }

      const response = await axios.get(this.baseURL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        params: { s: query },
        timeout: 20000,
        validateStatus: () => true,
      });

      if (!response.data) {
        throw new Error("Empty response from server");
      }

      // 🔒 Detect Cloudflare block
      if (
        response.data.includes("cf-browser-verification") ||
        response.data.includes("Just a moment")
      ) {
        throw new Error("Blocked by Cloudflare protection");
      }

      const $ = cheerio.load(response.data);
      const results = [];

      // selector utama
      let cards = $(".as-anime-card");

      // fallback selector
      if (cards.length === 0) {
        cards = $("article");
      }

      cards.each((i, el) => {
        const $el = $(el);

        const title =
          $el.find(".as-anime-title").text().trim() ||
          $el.find("h2").text().trim();

        const link =
          $el.attr("href") ||
          $el.find("a").attr("href");

        if (!title || !link) return;

        results.push({
          title,
          url: link.startsWith("http") ? link : this.baseURL + link,
          image: $el.find("img").attr("src") || "",
          rating:
            $el.find(".as-rating").text().replace("⭐", "").trim() || "",
          type:
            $el.find(".as-type").text().replace("📺", "").trim() || "",
          season:
            $el.find(".as-season").text().replace("📅", "").trim() || "",
          synopsis:
            $el.find(".as-synopsis").text().trim() || "",
          genres: $el
            .find(".as-genre-tag")
            .map((i, g) => $(g).text().trim())
            .get(),
        });
      });

      if (results.length === 0) {
        return {
          status: "success",
          message: "No results found",
          data: [],
        };
      }

      return {
        status: "success",
        total: results.length,
        data: results,
      };
    } catch (err) {
      return {
        status: "error",
        message: err.message,
      };
    }
  }
}

module.exports = AnimeScraper;
