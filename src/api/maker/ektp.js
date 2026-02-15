const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const axios = require("axios");
const https = require("https");

const GITHUB_TOKEN = "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";

const agent = new https.Agent({ keepAlive: false, timeout: 30000 });

const github = axios.create({
  baseURL: "https://api.github.com",
  timeout: 0,
  responseType: "arraybuffer",
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3.raw",
    "User-Agent": "Canvas-EKTP",
  },
  httpsAgent: agent,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
  transitional: { clarifyTimeoutError: true },
});

async function retry(fn, times = 3) {
  try {
    return await fn();
  } catch (e) {
    const code = e.code || "";
    const msg = e.message || "";
    if (
      times > 0 &&
      (code === "ECONNRESET" ||
        code === "ETIMEDOUT" ||
        code === "ERR_STREAM_ABORTED" ||
        msg.includes("socket") ||
        msg.includes("abort"))
    ) {
      await new Promise((r) => setTimeout(r, 2000));
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
    const res = await github.get(path).catch((e) => {
      throw new Error(`Gagal fetch file GitHub: ${e.message}`);
    });
    if (!res.data || res.data.length === 0) {
      throw new Error(`File ${path} kosong atau tidak ditemukan`);
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
  try {
    await registerFont("/repos/Reyz2902/font/contents/ARRIAL.ttf", "Arial");
    await registerFont("/repos/Reyz2902/font/contents/OCR.ttf", "Ocr");
    await registerFont("/repos/Reyz2902/font/contents/SIGN.ttf", "Sign");
    fontsReady = true;
  } catch (err) {
    console.error("Gagal load font:", err.message);
  }
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
  try {
    templateImage = await loadPrivateImage(
      "/repos/Reyz2902/project/contents/images/LogoTools/ektp.jpg"
    );
  } catch (err) {
    console.error("Gagal load template image:", err.message);
  }
}

function createImageResponse(buffer, res) {
  res.set({
    "Content-Type": "image/png",
    "Content-Length": buffer.length,
    "Cache-Control": "public, max-age=3600",
  });
  res.send(buffer);
}

async function generateEktp(query) {
  if (!templateImage) {
    await preloadAssets();
  }

  let photo;
  try {
    photo = await loadImage(query.pas_photo);
  } catch (err) {
    throw new Error("Foto tidak bisa di-load: " + err.message);
  }

  const canvas = createCanvas(850, 530);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(templateImage, 0, 0, 850, 530);

  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.font = "bold 25px Arial";
  ctx.fillText(`PROVINSI ${(query.provinsi || "").toUpperCase()}`, 425, 45);
  ctx.fillText((query.kota || "").toUpperCase(), 425, 75);

  ctx.textAlign = "left";
  ctx.font = "35px Ocr";
  ctx.fillText((query.nik || "").toUpperCase(), 205, 140);

  ctx.font = "bold 20px Arial";
  const x = 225;
  const fields = [
    "nama",
    "ttl",
    "jenis_kelamin",
    "golongan_darah",
    "alamat",
    "rt/rw",
    "kel/desa",
    "kecamatan",
    "agama",
    "status",
    "pekerjaan",
    "kewarganegaraan",
    "masa_berlaku",
  ];
  let y = 180;
  for (let field of fields) {
    ctx.fillText((query[field] || "").toUpperCase(), x, y);
    y += 25;
  }

  const photoX = 635,
    photoY = 150,
    photoW = 180,
    photoH = 240;
  ctx.drawImage(photo, photoX, photoY, photoW, photoH);

  ctx.textAlign = "center";
  ctx.font = "16px Arial";
  ctx.fillText((query.kota || "").toUpperCase(), photoX + photoW / 2, photoY + photoH + 35);
  ctx.fillText(query.terbuat || "", photoX + photoW / 2, photoY + photoH + 60);

  ctx.font = "36px Sign";
  const firstName = (query.nama || "").split(" ")[0] || "";
  ctx.fillText(firstName, photoX + photoW / 2, photoY + photoH + 110);

  return canvas.toBuffer("image/png");
}

module.exports = function (app) {
  preloadAssets().catch(() => {});

  app.get("/canvas/ektp", async (req, res) => {
    try {
      const q = req.query;
      const requiredFields = ["nik", "nama", "provinsi", "kota", "pas_photo"];
      for (let f of requiredFields) {
        if (!q[f]) {
          return res.status(400).json({
            status: false,
            creator: "Nayone API",
            error: `Missing required parameter: ${f}`,
          });
        }
      }

      const buffer = await generateEktp(q);
      createImageResponse(buffer, res);
    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "Z7",
        error: err.message || "Internal Server Error",
      });
    }
  });
};
