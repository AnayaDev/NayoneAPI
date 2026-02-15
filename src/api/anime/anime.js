const axios = require('axios');
const cheerio = require('cheerio');

class NontonAnimeAPI {
  constructor() {
    this.baseURL = 'https://s9.nontonanimeid.boats';
    this.headers = {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    };
  }

  async search(query) {
    const response = await axios.get(this.baseURL, {
      headers: this.headers,
      params: { s: query },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.as-anime-card').each((i, el) => {
      const $el = $(el);
      results.push({
        title: $el.find('.as-anime-title').text().trim(),
        url: $el.attr('href'),
        image: $el.find('img').attr('src') || '',
        rating: $el.find('.as-rating').text().replace('⭐', '').trim(),
        type: $el.find('.as-type').text().replace('📺', '').trim(),
        season: $el.find('.as-season').text().replace('📅', '').trim(),
        synopsis: $el.find('.as-synopsis').text().trim(),
        genres: $el.find('.as-genre-tag').map((i, g) => $(g).text()).get()
      });
    });

    return results;
  }

  async getDetail(url) {
    const response = await axios.get(url, {
      headers: this.headers,
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    const genres = [];
    $('.anime-card__genres .genre-tag').each((i, el) => {
      genres.push($(el).text().trim());
    });

    const episodesList = [];
    $('.episode-item').each((i, el) => {
      const $el = $(el);
      episodesList.push({
        title: $el.find('.ep-title').text().trim(),
        url: $el.attr('href'),
        date: $el.find('.ep-date').text().trim()
      });
    });

    return {
      title: $('.entry-title').text().replace('Nonton', '').replace('Sub Indo', '').trim(),
      image: $('.anime-card__sidebar img').attr('src'),
      score: $('.anime-card__score .value').text().trim(),
      type: $('.anime-card__score .type').text().trim(),
      english: $('li:contains("English:")').text().replace('English:', '').trim(),
      studios: $('li:contains("Studios:")').text().replace('Studios:', '').trim(),
      aired: $('li:contains("Aired:")').text().replace('Aired:', '').trim(),
      status: $('.info-item.status-finish').text().trim(),
      episodes: $('.info-item:contains("Episodes")').text().trim(),
      duration: $('.info-item:contains("min")').text().trim(),
      genres,
      synopsis: $('.synopsis-prose p').text().trim(),
      episodesList,
      trailer: $('.trailerbutton').attr('href') || ''
    };
  }
}

module.exports = function(app) {

  app.get("/anime/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          status: false,
          message: "Query parameter 'q' is required"
        });
      }

      const api = new NontonAnimeAPI();
      const result = await api.search(q);

      res.status(200).json({
        status: true,
        creator: "Nayone API",
        result
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

  app.get("/anime/detail", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({
          status: false,
          message: "Query parameter 'url' is required"
        });
      }

      const api = new NontonAnimeAPI();
      const result = await api.getDetail(url);

      res.status(200).json({
        status: true,
        creator: "Nayone API",
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
