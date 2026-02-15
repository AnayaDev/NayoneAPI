const axios = require('axios');
const cheerio = require('cheerio');

class GoreCenter {
  constructor() {
    this.baseUrl = 'https://gorecenter.com';
  }

  async scrape(query) {
    try {
      const { data } = await axios.get(`${this.baseUrl}/?s=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const $ = cheerio.load(data);
      const articles = [];

      $('article').each((_, el) => {
        const title = $(el).find('.entry-title a').text().trim();
        const url = $(el).find('.entry-title a').attr('href');
        const thumb = $(el).find('img').attr('src');

        if (title && url) {
          articles.push({
            title,
            url,
            thumb
          });
        }
      });

      const results = [];

      for (const item of articles.slice(0, 3)) {
        try {
          const articleRes = await axios.get(item.url);
          const $$ = cheerio.load(articleRes.data);

          const content = [];
          $$('.entry-content p').each((i, el) => {
            const text = $$(el).text().trim();
            if (text) content.push(text);
          });

          results.push({
            news: {
              title: item.title.toUpperCase(),
              url: item.url,
              image: item.thumb || '',
              source: 'GoreCenter'
            },
            detail: {
              title: $$('h1').text().trim() || item.title,
              content: content.slice(0, 3)
            }
          });

        } catch (err) {
          continue;
        }
      }

      return results;

    } catch (error) {
      return [];
    }
  }
}

// Export sebagai route Express
module.exports = function(app) {
  app.get("/anime/gore", async (req, res) => {
    try {
      const query = req.query.q || 'accident';
      const scraper = new GoreCenter();
      const result = await scraper.scrape(query);

      res.status(200).json({
        status: true,
        creator: "Nayone API",
        query,
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
