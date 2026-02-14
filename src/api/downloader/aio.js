const axios = require('axios');

class AllInOneDownloader {
  constructor() {
    this.baseURL = 'https://allinonedownloader.com';
    this.endpoint = '/system/3c829fbbcf0387c.php';
  }

  async download(url) {

    if (!url) throw new Error("URL is required");

    const headers = {
      'accept': '*/*',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'origin': this.baseURL,
      'referer': `${this.baseURL}/`,
      'user-agent': 'Mozilla/5.0 (Linux; Android 6.0) Chrome/144.0.0.0 Mobile Safari/537.36',
      'x-requested-with': 'XMLHttpRequest'
    };

    const payload = new URLSearchParams({
      url: url,
      token: 'ac98e0708b18806a7e0aedaf8bfd135b9605ce9e617aebbdf3118d402ae6f15f',
      urlhash: '/EW6oWxKREb5Ji1lQRgY2f4FkImCr6gbFo1HX4VAUuiJrN+7veIcnrr+ZrfMg0Jyo46ABKmFUhf2LpwuIxiFJZZObl9tfJG7E9EMVNIbkNyiqCIdpc61WKeMmmbMW+n6'
    });

    const response = await axios.post(
      `${this.baseURL}${this.endpoint}`,
      payload.toString(),
      { headers }
    );

    return response.data;
  }
}

module.exports = function(app) {

  app.get("/download/allinone", async (req, res) => {

    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Url is required"
      });
    }

    try {

      const downloader = new AllInOneDownloader();
      const result = await downloader.download(url);

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
