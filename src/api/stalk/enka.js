const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeEnkaProfile(uid) {
  if (!uid) throw new Error("UID is required");

  const url = `https://enka.network/u/${uid}/`;
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const result = {
    uid,
    playerInfo: {
      nickname: '',
      level: 0,
      signature: '',
      worldLevel: 0,
      achievements: 0,
      spiralAbyss: '',
      theater: '',
      stygianOnslaught: '',
      avatar: ''
    },
    characters: []
  };

  const nickname = $('h1.svelte-ea8b6b').first().text().trim();
  if (nickname) result.playerInfo.nickname = nickname;

  const arText = $('.ar.svelte-ea8b6b').text().trim();
  const arMatch = arText.match(/AR (\d+)/);
  if (arMatch) result.playerInfo.level = parseInt(arMatch[1]);

  const wlMatch = arText.match(/WL (\d+)/);
  if (wlMatch) result.playerInfo.worldLevel = parseInt(wlMatch[1]);

  const signature = $('.signature.svelte-ea8b6b').text().trim();
  if (signature) result.playerInfo.signature = signature;

  return result;
}

module.exports = function(app) {

  app.get("/stalk/enka", async (req, res) => {

    const { uid } = req.query;

    if (!uid) {
      return res.status(400).json({
        status: false,
        error: "UID is required"
      });
    }

    try {

      const result = await scrapeEnkaProfile(uid);

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
