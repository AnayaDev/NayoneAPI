const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

class DoronimeAnime {
  constructor() {
    this.baseUrl = 'https://doronime.id';
    this.headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml",
      "Referer": this.baseUrl
    };
  }

  async scrape(keyword) {
    if (!keyword) throw new Error("Keyword is required");

    // ✅ FIX search URL
    const searchUrl = `${this.baseUrl}/?s=${encodeURIComponent(keyword)}`;

    const searchResponse = await axios.get(searchUrl, {
      headers: this.headers
    });

    if (!searchResponse.data) {
      throw new Error("Failed to fetch search page");
    }

    const $ = cheerio.load(searchResponse.data);
    const animeList = [];

    $('.Card--column').each((i, el) => {
      if (i < 3) {
        const title = $(el).attr('title');
        const url = $(el).attr('href');
        const image = $(el).find('img').attr('src');

        if (title && url) {
          animeList.push({
            title,
            url,
            image: image || null,
            type: $(el).find('.Card__badge--bottom').text().trim() || null,
            status: $(el).find('.Badge--success').text().trim() || null
          });
        }
      }
    });

    const results = await Promise.all(
      animeList.map(async (item) => {
        try {
          const detailResponse = await axios.get(item.url, {
            headers: this.headers
          });

          const $$ = cheerio.load(detailResponse.data);
          const episodes = [];

          $$('.Content__table-body').each((i, el) => {
            if (i < 5) {
              const epLink = $$(el).find('.col:first-child a');
              if (epLink.length) {
                episodes.push({
                  episode: epLink.text().trim(),
                  title: $$(el).find('.col-9.col-md-7 a').text().trim(),
                  url: epLink.attr('href')
                });
              }
            }
          });

          return {
            anime: item,
            detail: {
              title: $$('.Content__title').text().trim() || item.title,
              description:
                $$('meta[property="og:description"]').attr('content') || "",
              image:
                $$('meta[property="og:image"]').attr('content') || item.image,
              synopsis:
                $$('.Content__tabs-content--small p').text().trim() || "",
              episodes
            }
          };

        } catch (err) {
          return null;
        }
      })
    );

    return { anime: results.filter(Boolean) };
  }
}

// 🔥 Endpoint
app.get('/anime/doronime', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      status: false,
      creator: "Nayone API",
      message: "Query parameter 'q' is required"
    });
  }

  try {
    const scraper = new DoronimeAnime();
    const result = await scraper.scrape(q);

    res.json({
      status: true,
      creator: "Nayone API",
      result
    });

  } catch (error) {
    console.error("SCRAPER ERROR:", error.message);

    res.status(500).json({
      status: false,
      creator: "Nayone API",
      message: "Internal Server Error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
