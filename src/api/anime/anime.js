const axios = require('axios');
const cheerio = require('cheerio');

class NontonAnimeAPI {
  constructor() {
    this.baseURL = 'https://s9.nontonanimeid.boats';
    this.headers = {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'accept': 'text/html,application/xhtml+xml'
    };
  }

  async search(query) {
    if (!query) throw new Error("Query is required");

    const response = await axios.get(this.baseURL, {
      headers: this.headers,
      params: { s: query },
      timeout: 15000
    });

    if (!response.data) throw new Error("Empty response");

    const $ = cheerio.load(response.data);
    const results = [];

    let cards = $('.as-anime-card');

    // fallback kalau selector berubah
    if (cards.length === 0) {
      cards = $('article');
    }

    cards.each((i, el) => {
      const $el = $(el);

      const title =
        $el.find('.as-anime-title').text().trim() ||
        $el.find('h2').text().trim();

      const link =
        $el.attr('href') ||
        $el.find('a').attr('href');

      if (!title || !link) return;

      results.push({
        title,
        url: link.startsWith('http') ? link : this.baseURL + link,
        image: $el.find('img').attr('src') || '',
        rating: $el.find('.as-rating').text().replace('⭐', '').trim() || '',
        type: $el.find('.as-type').text().replace('📺', '').trim() || '',
        season: $el.find('.as-season').text().replace('📅', '').trim() || '',
        synopsis: $el.find('.as-synopsis').text().trim() || '',
        genres: $el.find('.as-genre-tag')
          .map((i, g) => $(g).text().trim())
          .get()
      });
    });

    if (results.length === 0) {
      throw new Error("No results found (selector may have changed)");
    }

    return results;
  }

  async getDetail(url) {
    if (!url) throw new Error("URL is required");

    const response = await axios.get(url, {
      headers: this.headers,
      timeout: 15000
    });

    if (!response.data) throw new Error("Empty detail response");

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
      title: $('.entry-title')
        .text()
        .replace('Nonton', '')
        .replace('Sub Indo', '')
        .trim(),
      image: $('.anime-card__sidebar img').attr('src') || '',
      score: $('.anime-card__score .value').text().trim() || '',
      type: $('.anime-card__score .type').text().trim() || '',
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
