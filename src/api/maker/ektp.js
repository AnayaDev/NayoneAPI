const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const axios = require("axios");
const https = require("https");

const GITHUB_TOKEN = "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"

const agent = new https.Agent({
  keepAlive: false,
  timeout: 30000
});

const github = axios.create({
  baseURL: "https://api.github.com",
  timeout: 0,
  responseType: "arraybuffer",
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3.raw",
    "User-Agent": "Canvas-EKTP"
  },
  httpsAgent: agent,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
  transitional: {
    clarifyTimeoutError: true
  }
});

async function retry(fn, times = 3) {
  try {
    return await fn();
  } catch (e) {
    const code = e.code || "";
    const msg = e.message || "";
    if (
      times > 0 &&
      (
        code === "ECONNRESET" ||
        code === "ETIMEDOUT" ||
        code === "ERR_STREAM_ABORTED" ||
        msg.includes("socket") ||
        msg.includes("abort")
      )
    ) {
      await new Promise(r => setTimeout(r, 2000));
      return retry(fn, times - 1);
    }
    throw e;
  }
}

const fontCache = new Set();
const imageCache = new Map();
let fontsReady = false;
let templateImage;

async function fetchPrivateFile(path) {
  return retry(async () => {
    const res = await github.get(path);
    if (!res.data || res.data.length === 0) {
      throw new Error("File kosong dari GitHub");
    }
    return Buffer.from(Uint8Array.from(res.data));
  });
}

async function registerFont(path, name) {
  if (fontCache.has(name)) return;
  const buffer = await fetchPrivateFile(path);
  GlobalFonts.register(buffer, name);
  fontCache.add(name);
}

async function initFonts() {
  if (fontsReady) return;
  await registerFont("/repos/Reyz2902/font/contents/ARRIAL.ttf", "Arial");
  await registerFont("/repos/Reyz2902/font/contents/OCR.ttf", "Ocr");
  await registerFont("/repos/Reyz2902/font/contents/SIGN.ttf", "Sign");
  fontsReady = true;
}

async function loadPrivateImage(path) {
  if (imageCache.has(path)) return imageCache.get(path);
  const buffer = await fetchPrivateFile(path);
  const img = await loadImage(buffer);
  imageCache.set(path, img);
  return img;
}

async function preloadAssets() {
  await initFonts();
  templateImage = await loadPrivateImage(
    "/repos/Reyz2902/project/contents/images/LogoTools/ektp.jpg"
  );
}

function createImageResponse(buffer, res) {
  res.set({
    "Content-Type": "image/png",
    "Content-Length": buffer.length,
    "Cache-Control": "public, max-age=3600"
  });
  res.send(buffer);
}

async function generateEktp(query) {
  if (!templateImage) {
    await preloadAssets();
  }

  const photo = await loadImage(query.pas_photo);

  const canvas = createCanvas(850, 530);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(templateImage, 0, 0, 850, 530);

  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.font = "bold 25px Arial";
  ctx.fillText(`PROVINSI ${query.provinsi.toUpperCase()}`, 425, 45);
  ctx.fillText(query.kota.toUpperCase(), 425, 75);

  ctx.textAlign = "left";
  ctx.font = "35px Ocr";
  ctx.fillText(query.nik, 205, 140);

  ctx.font = "bold 20px Arial";
  const x = 225;
  ctx.fillText(query.nama.toUpperCase(), x, 180);
  ctx.fillText(query.ttl.toUpperCase(), x, 205);
  ctx.fillText(query.jenis_kelamin.toUpperCase(), x, 230);
  ctx.fillText(query.golongan_darah.toUpperCase(), 550, 230);
  ctx.fillText(query.alamat.toUpperCase(), x, 255);
  ctx.fillText(query["rt/rw"].toUpperCase(), x, 282);
  ctx.fillText(query["kel/desa"].toUpperCase(), x, 307);
  ctx.fillText(query.kecamatan.toUpperCase(), x, 332);
  ctx.fillText(query.agama.toUpperCase(), x, 358);
  ctx.fillText(query.status.toUpperCase(), x, 383);
  ctx.fillText(query.pekerjaan.toUpperCase(), x, 409);
  ctx.fillText(query.kewarganegaraan.toUpperCase(), x, 434);
  ctx.fillText(query.masa_berlaku.toUpperCase(), x, 459);

  const photoX = 635;
  const photoY = 150;
  const photoW = 180;
  const photoH = 240;
  ctx.drawImage(photo, photoX, photoY, photoW, photoH);

  ctx.textAlign = "center";
  ctx.font = "16px Arial";
  ctx.fillText(
    query.kota.toUpperCase(),
    photoX + photoW / 2,
    photoY + photoH + 35
  );
  ctx.fillText(
    query.terbuat,
    photoX + photoW / 2,
    photoY + photoH + 60
  );

  ctx.font = "36px Sign";
  ctx.fillText(
    query.nama.split(" ")[0],
    photoX + photoW / 2,
    photoY + photoH + 110
  );

  return canvas.toBuffer("image/png");
}

module.exports = function (app) {
  preloadAssets().catch(() => {});

  app.get("/canvas/ektp", async (req, res) => {
    try {
      const q = req.query;

      if (!q.nik || !q.nama || !q.provinsi || !q.kota || !q.pas_photo) {
        return res.status(400).json({
          status: false,
          creator: "Nayone API",
          error: "Missing required parameters"
        });
      }

      const buffer = await generateEktp(q);
      createImageResponse(buffer, res);
    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "Z7",
        error: err.message || "Internal Server Error"
      });
    }
  });
};
