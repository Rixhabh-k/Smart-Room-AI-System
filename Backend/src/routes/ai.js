const express = require("express");
const OpenAI = require("openai");

const router = express.Router();

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ✅ Store latest advice (ESP will fetch this)

let latestAdvice = "Waiting for AI advice...";

// Free fallback models

const FREE_MODELS = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-3-4b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "arcee-ai/trinity-large-preview:free",
  "z-ai/glm-4.5-air:free"
];

// 🔵 Generate AI Advice

router.post("/ai-advice", async (req, res) => {
  try {
    const { temperature, humidity } = req.body;

    let response = null;

    for (const model of FREE_MODELS) {
      try {
        const completion = await client.chat.completions.create({
          model,

          messages: [
            {
              role: "user",

              content: `You are a smart room AI assistant.

Temperature: ${temperature}°C
Humidity: ${humidity}%

Give short advice about AC and fan.

Keep response under 15 words.`,
            },
          ],

          max_tokens: 50,
        });

        response = completion.choices[0].message.content;

        console.log(`✅ Model used: ${model}`);

        // ✅ SAVE FOR ESP

        latestAdvice = response;

        console.log("📢 Latest Advice Saved:", latestAdvice);

        break;
      } catch (e) {
        console.log(`❌ ${model} failed, trying next...`);
      }
    }

    if (!response) {
      return res.status(500).json({
        error: "All models failed",
      });
    }

    res.json({
      advice: response,
    });
  } catch (error) {
    console.error("AI Error:", error.message);

    res.status(500).json({
      error: "AI error",
    });
  }
});

// 🟢 ESP32 WILL CALL THIS

router.get("/latest-advice", (req, res) => {
  res.json({
    advice: latestAdvice,
  });
});

module.exports = router;
