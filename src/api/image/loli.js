const axios = require("axios");

module.exports = function(app) {

    async function loliArchive() {
        try {
            // Ambil daftar URL dari GitHub
            const { data } = await axios.get(
                "https://raw.githubusercontent.com/synshin9/loli-r-img/refs/heads/main/links.json"
            );

            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error("No images found");
            }

            // Pilih random URL
            const randomUrl = data[Math.floor(Math.random() * data.length)];

            // Ambil gambar sebagai buffer
            const response = await axios.get(randomUrl, { responseType: "arraybuffer" });
            return Buffer.from(response.data);

        } catch (error) {
            throw error;
        }
    }

    app.get("/image/loli", async (req, res) => {
        try {
            const buffer = await loliArchive();
            res.writeHead(200, {
                "Content-Type": "image/png",
                "Content-Length": buffer.length
            });
            res.end(buffer);
        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    });

};