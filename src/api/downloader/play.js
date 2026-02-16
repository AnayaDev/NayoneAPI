const express = require("express");
const ytdl = require("ytdl-core");
const ytsr = require("yt-search");
const app = express();

// Ambil info video dari URL atau keyword
async function getYoutubeInfo(query) {
  let video;

  if (ytdl.validateURL(query)) {
    video = await ytdl.getInfo(query);
  } else {
    // Cari video berdasarkan keyword
    const search = await ytsr(query);
    if (!search || !search.videos || search.videos.length === 0) {
      throw new Error("Video tidak ditemukan");
    }
    video = await ytdl.getInfo(search.videos[0].url);
  }

  const details = video.videoDetails;
  return {
    title: details.title,
    description: details.description,
    thumbnail: details.thumbnails[details.thumbnails.length - 1].url,
    duration: details.lengthSeconds,
    url: details.video_url,
  };
}

// Endpoint /download/play dengan dual-mode dan support search
app.get("/downloader/play", async (req, res) => {
  try {
    const query = req.query.q;
    const mode = (req.query.mode || "audio").toLowerCase();

    if (!query) {
      return res.status(400).json({
        status: false,
        error: "Query parameter 'q' wajib diisi",
      });
    }

    const info = await getYoutubeInfo(query);

    if (mode === "json") {
      return res.json({
        status: true,
        result: info
      });
    }

    // Mode audio → streaming MP3 langsung
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `inline; filename="${info.title}.mp3"`,
    });

    ytdl(info.url, { filter: "audioonly", quality: "highestaudio" }).pipe(res);

  } catch (err) {
    res.status(500).json({
      status: false,
      error: err.message || "Internal Server Error",
    });
  }
});

app.listen(3000, () => console.log("Server berjalan di port 3000"));
