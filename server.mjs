import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================================================================
//  OPENAI CLIENT — NOWY SILNIK "RESPONSES" (jak GPTs)
// ================================================================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ================================================================
//  SYSTEM PROMPT — TWÓJ PEŁNY PROMPT DOMADVISOR
//  (NIC TU NIE ZMIENIAJ – wkleiłeś go poprawnie)
// ================================================================

const systemPrompt = `📚 DOMADVISOR – INSTRUKCJA KOMPLETNA
${"=".repeat(60)}
${systemPrompt} 
`;

// ================================================================
//  NOWA FUNKCJA callModel — identyczna jak runtime GPTs
// ================================================================

async function callModel(messages) {
  try {
    const response = await client.responses.create({
      model: "gpt-4o",
      input: messages,
      temperature: 0.3,
      max_output_tokens: 12000,   // długie odpowiedzi OK
      tools: [
        { type: "web_browsing" }  // <<< browsing działa jak w GPTs
      ]
    });

    return response.output_text;
  } catch (err) {
    console.error("OpenAI ERROR:", err);
    throw new Error("OpenAI request failed");
  }
}

// ================================================================
//  /api/chat — DIALOG (teraz jak GPTs)
// ================================================================

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
    console.error("/api/chat error:", err);
    return res.status(500).json({
      success: false,
      error: "/api/chat — błąd serwera."
    });
  }
});

// ================================================================
//  /api/report — RAPORT PREMIUM (4000–6000 słów)
//  Tworzony JEDNYM wywołaniem jak w GPTs
// ================================================================

app.post("/api/report", async (req, res) => {
  try {
    const { location, price, area, floor, description } = req.body || {};

    const userInput = `
Lokalizacja: ${location || "brak"}
Cena: ${price || "brak"}
Metraż: ${area || "brak"}
Piętro: ${floor || "brak"}

Opis oferty:
${description || "brak"}
`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `
Wygeneruj pełny RAPORT PREMIUM (4000–6000 słów)
zgodnie z pełną metodologią DomAdvisor.

DANE:
${userInput}
        `
      }
    ];

    const report = await callModel(messages);

    return res.json({
      success: true,
      report
    });

  } catch (err) {
    console.error("/api/report error:", err);
    return res.status(500).json({
      success: false,
      error: "/api/report — błąd serwera."
    });
  }
});

// ================================================================
//  START SERWERA
// ================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 DomAdvisor GPTs backend działa!");
  console.log("🔑 Klucz OpenAI:", process.env.OPENAI_API_KEY ? "OK ✓" : "BRAK ✗");
  console.log("🌐 Port:", PORT);
});
