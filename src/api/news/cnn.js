const axios = require('axios');
const cheerio = require('cheerio');

class CNNNews {
  constructor() {
    this.baseUrl = 'https://www.cnnindonesia.com';
  }

  async scrape() {
    const homeResponse = await axios.get(this.baseUrl);
    const $ = cheerio.load(homeResponse.data);

    const newsList = [];

    $('.nhl-list article').each((i, el) => {
      const article = $(el);
      const link = article.find('a').first();
      const url = link.attr('href');

      if (url && url !== '#') {
        newsList.push({
          url: url.startsWith('http') ? url : this.baseUrl + url,
          title: link.find('h2').text().trim(),
          image: article.find('img').attr('src') || '',
          category: article.find('.text-cnn_red').first().text().trim() || ''
        });
      }
    });

    const results = [];

    for (const item of newsList.slice(0, 3)) {
      try {
        const articleResponse = await axios.get(item.url);
        const $$ = cheerio.load(articleResponse.data);

        const content = [];
        $$('.detail-text p').each((i, el) => {
          const text = $$(el).text().trim();
          if (text && !text.includes('BACA JUGA:')) content.push(text);
        });

        results.push({
          news: {
            title: item.title,
            url: item.url,
            image: item.image,
            category: item.category
          },
          detail: {
            title: $$('h1').text().trim() || item.title,
            date: $$('.text-cnn_grey.text-sm').first().text().trim() || '',
            author: $$('.text-cnn_red').first().text().trim() || '',
            content: content.slice(0, 3),
            tags: $$('.flex.flex-wrap.gap-3 a')
              .map((i, el) => $$(el).text().trim())
              .get()
              .slice(0, 3)
          }
        });

      } catch (err) {
        continue;
      }
    }

    return { news: results };
  }
}

module.exports = function(app) {

  app.get("/news/cnn", async (req, res) => {

    try {

      const scraper = new CNNNews();
      const result = await scraper.scrape();

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
