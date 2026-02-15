/**
 🍀 Family100 Game API
*/

import express from "express"
import fetch from "node-fetch"

const app = express()
const PORT = 3000

const URL = "https://raw.githubusercontent.com/zionjs0/whatsapp-media/main/file_1769755199641.json"

app.use(express.json())

async function getGame() {
  const res = await fetch(URL)
  return res.json()
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/*
  GET /game/family100
*/
app.get("/game/family100", async (req, res) => {
  try {
    const data = await getGame()
    const game = pickRandom(data)

    res.json({
      status: true,
      code: 200,
      creator: "Nayone API",
      result: {
        soal: game.soal,
        total_jawaban: game.jawaban.length,
        jawaban: game.jawaban
      }
    })

  } catch (err) {
    res.status(500).json({
      status: false,
      code: 500,
      message: "Failed to fetch Family100 game",
      error: err.message
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
