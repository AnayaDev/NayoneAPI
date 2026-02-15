const { createCanvas, loadImage, registerFont } = require("canvas");
const assets = require("@putuofc/assetsku");
const FileType = require("file-type");
const multer = require("multer");

// ── multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

// ── proxy helper
function proxy() {
  return process.env.PROXY_URL || null;
}

// ── helpers
function createImageResponse(res, buffer, filename = null) {
  res.set({
    "Content-Type": "image/png",
    "Content-Length": buffer.length,
    "Cache-Control": "public, max-age=3600",
    ...(filename ? { "Content-Disposition": `inline; filename="${filename}"` } : {}),
  });
  return res.end(buffer);
}

async function isValidImageBuffer(buffer) {
  const type = await FileType.fromBuffer(buffer);
  return type && ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime);
}

// ── register fonts once at startup
registerFont(assets.font.get("ARRIAL"), { family: "Arial" });
registerFont(assets.font.get("OCR"),    { family: "Ocr"   });
registerFont(assets.font.get("SIGN"),   { family: "Sign"  });

// ── core canvas renderer
async function renderEktp({ provinsi, kota, nik, nama, ttl, jenis_kelamin, golongan_darah, alamat, rt_rw, kel_desa, kecamatan, agama, status, pekerjaan, kewarganegaraan, masa_berlaku, terbuat, pasPhotoSource }) {
  const template = await loadImage(assets.image.get("TEMPLATE"));
  
  let pasPhoto;
  try {
    pasPhoto = await loadImage(pasPhotoSource);
  } catch (err) {
    throw new Error("Failed to load passport photo. Ensure URL/file is valid.");
  }

  const width = 850, height = 530, radius = 20;
  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext("2d");

  // background with rounded corners
  ctx.fillStyle = "#F0F0F0";
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  ctx.drawImage(template, 0, 0, width, height);

  // header
  ctx.fillStyle = "black";
  ctx.font = "bold 25px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`PROVINSI ${provinsi.toUpperCase()}`, width / 2, 45);
  ctx.fillText(kota.toUpperCase(), width / 2, 75);

  // NIK
  ctx.textAlign = "left";
  ctx.font = "35px Ocr";
  ctx.fillText(nik, 205, 140);

  // fields
  ctx.font = "bold 20px Arial";
  const vx = 225;
  ctx.fillText(nama.toUpperCase(),            vx,  180);
  ctx.fillText(ttl.toUpperCase(),             vx,  205);
  ctx.fillText(jenis_kelamin.toUpperCase(),   vx,  230);
  ctx.fillText(golongan_darah.toUpperCase(), 550,  230);
  ctx.fillText(alamat.toUpperCase(),          vx,  255);
  ctx.fillText(rt_rw.toUpperCase(),           vx,  282);
  ctx.fillText(kel_desa.toUpperCase(),        vx,  307);
  ctx.fillText(kecamatan.toUpperCase(),       vx,  332);
  ctx.fillText(agama.toUpperCase(),           vx,  358);
  ctx.fillText(status.toUpperCase(),          vx,  383);
  ctx.fillText(pekerjaan.toUpperCase(),       vx,  409);
  ctx.fillText(kewarganegaraan.toUpperCase(), vx,  434);
  ctx.fillText(masa_berlaku.toUpperCase(),    vx,  459);

  // photo
  const photoX = 635, photoY = 150, photoW = 180, photoH = 240;
  const photoCanvas = createCanvas(photoW, photoH);
  const photoCtx    = photoCanvas.getContext("2d");

  const ar = pasPhoto.width / pasPhoto.height;
  let srcW, srcH, srcX, srcY;
  if (ar > photoW / photoH) {
    srcH = pasPhoto.height; srcW = srcH * (photoW / photoH);
    srcX = (pasPhoto.width - srcW) / 2; srcY = 0;
  } else {
    srcW = pasPhoto.width; srcH = srcW * (photoH / photoW);
    srcX = 0; srcY = (pasPhoto.height - srcH) / 2;
  }
  photoCtx.drawImage(pasPhoto, srcX, srcY, srcW, srcH, 0, 0, photoW, photoH);
  ctx.drawImage(photoCanvas, photoX, photoY, photoW, photoH);

  // signature area
  ctx.textAlign = "center";
  ctx.font = "16px Arial";
  ctx.fillText(kota.toUpperCase(), photoX + photoW / 2, photoY + photoH + 35);
  ctx.fillText(terbuat,            photoX + photoW / 2, photoY + photoH + 60);

  const signName = nama.split(" ")[0];
  ctx.font = "36px Sign";
  ctx.fillText(signName, photoX + photoW / 2, photoY + photoH + 110);

  return canvas.toBuffer("image/png", { quality: 0.95 });
}

// ── validation
function validateFields({ provinsi, kota, nik, nama, ttl, jenis_kelamin, golongan_darah, alamat, rt_rw, kel_desa, kecamatan, agama, status, pekerjaan, kewarganegaraan, masa_berlaku, terbuat }) {
  if (!provinsi || !kota || !nik || !nama || !ttl || !jenis_kelamin || !golongan_darah || !alamat || !rt_rw || !kel_desa || !kecamatan || !agama || !status || !pekerjaan || !kewarganegaraan || !masa_berlaku || !terbuat)
    return "Missing required parameters";

  if (!/^\d{16}$/.test(nik))
    return "Parameter 'nik' must be exactly 16 digits";

  if (!["Laki-laki", "Perempuan"].includes(jenis_kelamin.trim()))
    return "Parameter 'jenis_kelamin' must be 'Laki-laki' or 'Perempuan'";

  if (!["A", "B", "AB", "O", "-"].includes(golongan_darah.trim()))
    return "Parameter 'golongan_darah' must be 'A', 'B', 'AB', 'O', or '-'";

  return null;
}

// ── routes
module.exports = function (app) {

  // GET /api/m/ektp — pas_photo via URL
  app.get("/api/m/ektp", async (req, res) => {
    try {
      const q = req.query;
      const rt_rw   = (q["rt/rw"] || "").trim();
      const kel_desa = (q["kel/desa"] || "").trim();

      const err = validateFields({ ...q, rt_rw, kel_desa });
      if (err) return res.status(400).json({ status: false, error: err, code: 400 });

      if (!q.pas_photo || typeof q.pas_photo !== "string" || q.pas_photo.trim().length === 0)
        return res.status(400).json({ status: false, error: "Parameter 'pas_photo' must be a valid URL", code: 400 });

      const proxyBase = proxy();
      const photoUrl  = proxyBase ? proxyBase + q.pas_photo : q.pas_photo;

      const buffer = await renderEktp({
        provinsi:        q.provinsi.trim(),
        kota:            q.kota.trim(),
        nik:             q.nik.trim(),
        nama:            q.nama.trim(),
        ttl:             q.ttl.trim(),
        jenis_kelamin:   q.jenis_kelamin.trim(),
        golongan_darah:  q.golongan_darah.trim(),
        alamat:          q.alamat.trim(),
        rt_rw,
        kel_desa,
        kecamatan:       q.kecamatan.trim(),
        agama:           q.agama.trim(),
        status:          q.status.trim(),
        pekerjaan:       q.pekerjaan.trim(),
        kewarganegaraan: q.kewarganegaraan.trim(),
        masa_berlaku:    q.masa_berlaku.trim(),
        terbuat:         q.terbuat.trim(),
        pasPhotoSource:  photoUrl,
      });

      return createImageResponse(res, buffer, "ektp.png");

    } catch (error) {
      return res.status(500).json({ status: false, error: error.message || "Internal Server Error", code: 500 });
    }
  });

  // POST /api/m/ektp — pas_photo via file upload
  app.post("/maker/ektp", upload.single("pas_photo"), async (req, res) => {
    try {
      const b = req.body;
      const rt_rw   = (b["rt/rw"] || "").trim();
      const kel_desa = (b["kel/desa"] || "").trim();

      const err = validateFields({ ...b, rt_rw, kel_desa });
      if (err) return res.status(400).json({ status: false, error: err, code: 400 });

      if (!req.file || !req.file.buffer)
        return res.status(400).json({ status: false, error: "File 'pas_photo' is required", code: 400 });

      const validImage = await isValidImageBuffer(req.file.buffer);
      if (!validImage)
        return res.status(400).json({ status: false, error: "File 'pas_photo' must be a valid image (PNG, JPG, WEBP, GIF)", code: 400 });

      const buffer = await renderEktp({
        provinsi:        b.provinsi.trim(),
        kota:            b.kota.trim(),
        nik:             b.nik.trim(),
        nama:            b.nama.trim(),
        ttl:             b.ttl.trim(),
        jenis_kelamin:   b.jenis_kelamin.trim(),
        golongan_darah:  b.golongan_darah.trim(),
        alamat:          b.alamat.trim(),
        rt_rw,
        kel_desa,
        kecamatan:       b.kecamatan.trim(),
        agama:           b.agama.trim(),
        status:          b.status.trim(),
        pekerjaan:       b.pekerjaan.trim(),
        kewarganegaraan: b.kewarganegaraan.trim(),
        masa_berlaku:    b.masa_berlaku.trim(),
        terbuat:         b.terbuat.trim(),
        pasPhotoSource:  req.file.buffer,
      });

      return createImageResponse(res, buffer, "ektp.png");

    } catch (error) {
      return res.status(500).json({ status: false, error: error.message || "Internal Server Error", code: 500 });
    }
  });
};
