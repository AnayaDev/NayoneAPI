const axios = require('axios');
const cheerio = require('cheerio');

class NontonAnimeAPI {
  constructor() {
    this.baseURL = 'https://s9.nontonanimeid.boats';
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
  }

  getHeaders(customReferer = '') {
    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    return {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'referer': customReferer || 'https://s9.nontonanimeid.boats/',
      'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'upgrade-insecure-requests': '1',
      'user-agent': userAgent
    };
  }

  generateCookies() {
    const timestamp = Date.now();
    return {
      '_lscache_vary': Math.random().toString(36).substring(2, 34),
      '_ga_S0L4FL6T3J': `GS2.1.s${timestamp}`,
      '_ga': `GA1.2.${Math.floor(Math.random() * 999999999)}.${timestamp}`,
      '_gid': `GA1.2.${Math.floor(Math.random() * 999999999)}.${timestamp}`,
      '_gat_gtag_UA_79646797_8': '1'
    };
  }

  async search(query) {
    const cookies = this.generateCookies();
    const cookieString = Object.entries(cookies).map(([k,v]) => `${k}=${v}`).join('; ');

    const response = await axios.get(`${this.baseURL}/`, {
      headers: { ...this.getHeaders(), cookie: cookieString },
      params: { 's': query },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.as-anime-card').each((i, el) => {
      const $el = $(el);
      results.push({
        title: $el.find('.as-anime-title').text().trim(),
        url: $el.attr('href'),
        image: $el.find('img').attr('src'),
        rating: $el.find('.as-rating').text().replace('⭐','').trim(),
        type: $el.find('.as-type').text().replace('📺','').trim(),
        season: $el.find('.as-season').text().replace('📅','').trim(),
        synopsis: $el.find('.as-synopsis').text().trim(),
        genres: $el.find('.as-genre-tag').map((i,g) => $(g).text()).get()
      });
    });

    return results;
  }
}

module.exports = function(app) {
  app.get("/anime/searchanime", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          status: false,
          message: "Query parameter 'q' is required"
        });
      }

      const api = new NontonAnimeAPI();
      const results = await api.search(q);

      res.status(200).json({
        status: true,
        creator: "Nayone API",
        result: results
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });
};
