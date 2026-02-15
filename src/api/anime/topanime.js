/*
  My Anime List | Top Anime API Endpoint
  • Base : https://myanimelist.net
*/

import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const PORT = 3000;

async function scrapeTopAnime(limit = 10) {
  const url = "https://myanimelist.net/topanime.php";

  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  const $ = cheerio.load(res.data);
  const results = [];

  $(".ranking-list").each((i, el) => {
    if (i >= limit) return;

    const rank = $(el).find(".rank").text().trim() || null;
    const titleEl = $(el).find(".title h3 a");

    const title = titleEl.text().trim();
    const animeUrl = titleEl.attr("href") || null;
    const score = $(el).find(".score span").text().trim() || null;

    const imgEl = $(el).find(".title img");
    const cover =
      imgEl.attr("data-src") ||
      imgEl.attr("src") ||
      null;

    const infoRaw = $(el).find(".information").text().trim();
    const infoLines = infoRaw
      .split("\n")
      .map(v => v.trim())
      .filter(Boolean);

    const type = infoLines[0] || null;
    const aired = infoLines[1] || null;
    const members = infoLines[2] || null;

    if (title && animeUrl) {
      results.push({
        rank,
        title,
        score,
        cover,
        url: animeUrl,
        type,
        aired,
        members
      });
    }
  });

  return results;
}


/*
  GET /anime/top
  ?limit=5
*/
app.get("/anime/top", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const data = await scrapeTopAnime(limit);

    if (!data.length) {
      return res.status(404).json({
        status: false,
        code: 404,
        message: "Data top anime kosong"
      });
    }

    res.json({
      status: true,
      code: 200,
      creator: "Nayone API",
      result: data
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      code: 500,
      message: "Failed to fetch top anime",
      error: err.message
    });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
