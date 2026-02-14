import fetch from "node-fetch";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

async function AiCT(question, fileBuffer = null, mimeType = "image/jpeg", fileName = "image.jpg") {
  let file = null;

  if (fileBuffer) {
    file = {
      data: fileBuffer.toString("base64"),
      type: mimeType,
      name: fileName
    };
  }

  const res = await fetch("https://aifreeforever.com/api/generate-ai-answer", {
    method: "POST",
    headers: {
      "accept": "*/*",
      "accept-language": "id-ID",
      "content-type": "application/json",
      "referer": "https://aifreeforever.com/tools/free-chatgpt-no-login"
    },
    body: JSON.stringify({
      question,
      tone: "friendly",
      format: "paragraph",
      file
    })
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  return data.answer;
}

export default function (app) {

  // GET — teks saja
  app.get("/ai/chat", async (req, res) => {
    const { question } = req.query;

    if (!question) {
      return res.status(400).json({
        status: false,
        error: "Parameter 'question' wajib diisi"
      });
    }

    try {
      const answer = await AiCT(question);
      res.status(200).json({
        status: true,
        creator: "Nayone API",
        result: { answer }
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });

  // POST — teks + gambar opsional
  app.post("/ai/aifreeforeverchat", upload.single("image"), async (req, res) => {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        status: false,
        error: "Parameter 'question' wajib diisi"
      });
    }

    try {
      const fileBuffer = req.file ? req.file.buffer       : null;
      const mimeType  = req.file ? req.file.mimetype      : "image/jpeg";
      const fileName  = req.file ? req.file.originalname  : "image.jpg";

      const answer = await AiCT(question, fileBuffer, mimeType, fileName);
      res.status(200).json({
        status: true,
        creator: "Nayone API",
        result: { answer }
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });

}
