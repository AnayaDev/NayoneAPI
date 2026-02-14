const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

class DoronimeAnime {
  constructor() {
    this.baseUrl = 'https://doronime.id';
    this.headers = {
      'user-agent': 'Mozilla/5.0',
      'referer': this.baseUrl
    };
  }

  async scrape(keyword) {
    if (!keyword) throw new Error('Keyword is required');

    const searchResponse = await axios.get(`${this.baseUrl}/search`, {
      headers: this.headers,
      params: { s: keyword }
    });

    const $ = cheerio.load(searchResponse.data);
    const animeList = [];

    $('.Card--column').each((i, el) => {
      if (i < 3) {
        animeList.push({
          title: $(el).attr('title'),
          url: $(el).attr('href'),
          image: $(el).find('img').attr('src'),
          type: $(el).find('.Card__badge--bottom').text().trim(),
          status: $(el).find('.Badge--success').text().trim()
        });
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
              episodes.push({
                episode: $$(el).find('.col:first-child a').text().trim(),
                title: $$(el).find('.col-9.col-md-7 a').text().trim(),
                url: $$(el).find('.col:first-child a').attr('href')
              });
            }
          });

          return {
            anime: item,
            detail: {
              title: $$('.Content__title').text().trim(),
              description: $$('meta[property="og:description"]').attr('content') || '',
              image: $$('meta[property="og:image"]').attr('content') || '',
              synopsis: $$('.Content__tabs-content--small p').text().trim(),
              episodes
            }
          };
        } catch {
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
    res.status(500).json({
      status: false,
      creator: "Nayone API",
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
