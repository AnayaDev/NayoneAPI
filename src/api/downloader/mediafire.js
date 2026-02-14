const axios = require('axios')
const cheerio = require('cheerio')

class MediafireDL {
  constructor() {
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.mediafire.com/',
      'Upgrade-Insecure-Requests': '1'
    }
  }

  async scrape(url) {
    if (!url) throw new Error("URL is required")

    const res = await axios.get(url, {
      headers: this.headers,
      maxRedirects: 5
    })

    const $ = cheerio.load(res.data)

    const download = $('#download_link > a.input.popsok').attr('href') || null
    const filename = $('.dl-btn-label').first().text().trim() || null
    const filesize = $('#download_link > a.input.popsok')
      .text()
      .match(/\(([^)]+)\)/)?.[1] || null
    const filetype = $('.dl-info .filetype span')
      .first()
      .text()
      .trim() || null
    const uploaded = $('.details li')
      .eq(1)
      .find('span')
      .text()
      .trim() || null

    return {
      filename,
      filetype,
      filesize,
      uploaded,
      download
    }
  }
}

module.exports = function(app) {

  app.get("/download/mediafire", async (req, res) => {

    try {

      const { url } = req.query
      if (!url) {
        return res.status(400).json({
          status: false,
          error: "Parameter url diperlukan"
        })
      }

      const scraper = new MediafireDL()
      const result = await scraper.scrape(url)

      res.status(200).json({
        status: true,
        creator: "Nayone API",
        result
      })

    } catch (err) {

      res.status(500).json({
        status: false,
        error: err.message
      })

    }

  })

      }
