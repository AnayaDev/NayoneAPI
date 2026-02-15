/**
 🍀 Lyrics Generator API Endpoint
*/

import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

app.use(express.json());

async function generateLyrics(prompt) {
  const url = "https://lyricsgenerator.com/api/completion";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "accept": "*/*",
      "content-type": "text/plain;charset=UTF-8",
      "origin": "https://lyricsgenerator.com",
      "referer": "https://lyricsgenerator.com",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36"
    },
    body: JSON.stringify({ prompt })
  });

  return response.text();
}


/*
  GET /ai/lyrics?prompt=jika kamu mendua
*/
app.get("/ai/lyrics", async (req, res) => {
  try {
    const { prompt } = req.query;

    if (!prompt) {
      return res.status(400).json({
        status: false,
        code: 400,
        message: "Parameter 'prompt' diperlukan"
      });
    }

    const result = await generateLyrics(prompt);

    res.json({
      status: true,
      code: 200,
      creator: "Nayone API",
      result: result
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      code: 500,
      message: "Failed to generate lyrics",
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
