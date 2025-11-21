import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ===================================================================
//  OPENAI CLIENT — Responses API (GPTs-compatible)
// ===================================================================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===================================================================
//  SYSTEM PROMPT — WERSJA FINALNA DO PRODUKCJI
// ===================================================================

const systemPrompt = `
[ TU WKLEJASZ SWÓJ PEŁNY SYSTEM PROMPT WIEDZA — TEN Z KTÓRY CI POPRAWIŁEM ]
`;

// ===================================================================
//  FUNKCJA WYWOŁANIA GPT — responses.create()
// ===================================================================

async function callModel(messages) {
  const completion = await client.responses.create({
    model: "gpt-4o",
    input: messages,
    temperature: 0.25,
    max_output_tokens: 14000
  });

  return completion.output_text;
}

// ===================================================================
//  /api/chat — pełny dialog z historią
// ===================================================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Brak treści wiadomości." });
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message }
    ];

    const reply = await callModel(messages);

    return res.json({
      success: true,
      reply
    });

  } catch (err) {
    console.error("❌ /api/chat error:", err);
    return res.status(500).json({
      success: false,
      error: "Błąd serwera /api/chat."
    });
  }
});

// ===================================================================
//  /api/report — Raport Premium 4000–6000 słów
// ===================================================================

app.post("/api/report", async (req, res) => {
  try {
    const { location, price, area, floor, description } = req.body || {};

    const input = `
Lokalizacja: ${location}
Cena: ${price}
Metraż: ${area}
Piętro: ${floor}
Opis oferty:
${description}
`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `
Wygeneruj RAPORT PREMIUM (4000–6000 słów).
Użyj pełnej struktury 10-sekcyjnej DomAdvisor.
Dane wejściowe:
${input}
`
      }
    ];

    const report = await callModel(messages);

    return res.json({
      success: true,
      report
    });

  } catch (err) {
    console.error("❌ /api/report error:", err);
    return res.status(500).json({
      success: false,
      error: "Błąd serwera /api/report."
    });
  }
});

// ===================================================================
//  RUN SERVER
// ===================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 DomAdvisor backend działa");
  console.log("🌐 Port:", PORT);
  console.log("🔑 OPENAI KEY:", process.env.OPENAI_API_KEY ? "OK" : "BRAK");
});
