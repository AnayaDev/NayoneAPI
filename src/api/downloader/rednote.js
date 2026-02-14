const axios = require('axios');

async function rednoteDownloader(url) {
    if (!url) throw new Error('URL is required.');

    try {
        const response = await axios.post(
            'https://rednotedownloader.com/id',
            [url, ""],
            {
                headers: {
                    'Accept': 'text/x-component',
                    'Content-Type': 'application/json',
                    'Next-Action': '352bef296627adedcfc99e32c80dd93a4ee49d35',
                    'Next-Router-State-Tree': '%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22id%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Fid%22%2C%22refresh%22%5D%7D%2Cnull%2Cnull%2Ctrue%5D%7D%5D'
                }
            }
        );

        return response.data;

    } catch (err) {
        throw new Error(err.response?.data || err.message);
    }
}

module.exports = function(app) {

    app.get("/download/rednote", async (req, res) => {

        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: "Url is required"
            });
        }

        try {

            const result = await rednoteDownloader(url);

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
