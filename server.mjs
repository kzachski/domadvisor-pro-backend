import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================================================================
//  OPENAI CLIENT — Responses API (GPTs-like)
// ================================================================
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ================================================================
//  SYSTEM PROMPT — WERSJA BEZ BŁĘDÓW (KOMPLETNA)
// ================================================================
import fs from "fs";
const systemPrompt = fs.readFileSync("./knowledge.txt", "utf8");

// ================================================================
//  FUNKCJA Responses API — poprawny format input/output
// ================================================================
async function callModel(messages) {
  // KONWERSJA formatów chat-style → responses-style
  const converted = messages.map(m => {
    return {
      role: m.role,
      content: [
        { type: "text", text: m.content }
      ]
    };
  });

  const response = await client.responses.create({
    model: "gpt-4o",
    input: converted,
    max_output_tokens: 20000,
    temperature: 0.3,
    tools: [
      { type: "web_browsing" }
    ]
  });

  // OUTPUT — responses API
  return response.output_text;
}

// ================================================================
//  /api/chat — pełny dialog z historią
// ================================================================
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

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

  } catch (error) {
    console.error("/api/chat error:", error);
    return res.status(500).json({
      success: false,
      error: "Błąd serwera /api/chat."
    });
  }
});

// ================================================================
//  /api/report — pełny raport premium 4000–6000 słów
// ================================================================
app.post("/api/report", async (req, res) => {
  try {
    const { location, price, area, floor, description } = req.body || {};

    const input = `
Lokalizacja: ${location}
Cena: ${price}
Metraż: ${area}
Piętro: ${floor}

Opis:
${description}
`;

    const forcedPrompt = `
Jesteś DomAdvisor w TRYBIE RAPORTU PREMIUM.
Ignorujesz tryb dialogowy.
Generujesz natychmiast kompletny raport premium 4000–6000 słów.

Używaj pełnej metodologii DomAdvisor (Jakub + Magdalena).
Sekcje muszą być kompletne, spójne i zamknięte.

===========================================
SYSTEM KNOWLEDGE:
${systemPrompt}
===========================================
`;

    const messages = [
      { role: "system", content: forcedPrompt },
      {
        role: "user",
        content: `Wygeneruj pełny raport premium 4000–6000 słów na podstawie:\n${input}`
      }
    ];

    const report = await callModel(messages);

    return res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error("/api/report error:", error);
    return res.status(500).json({
      success: false,
      error: "Błąd serwera /api/report."
    });
  }
});

// ================================================================
//  START SERWERA
// ================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 DomAdvisor backend działa");
  console.log("🌐 Port:", PORT);
  console.log("🔑 API KEY:", process.env.OPENAI_API_KEY ? "OK" : "BRAK");
});
