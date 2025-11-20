import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ========================
//     SYSTEM PROMPT 
// ========================

const systemPrompt = `Jesteśmy DomAdvisor – duetem ekspertów AI działających 24/7... (TWÓJ CAŁY PROMPT WIEDZA)
`;

// ========================
//  GPT-5.1 — BROWSING OK!
// ========================

async function callModel(messages, maxTokens = 4500) {
  const completion = await client.chat.completions.create({
    model: "gpt-5.1",
    messages,
    max_tokens: maxTokens,
    temperature: 0.2,
    web: {
      search: true
    }
  });

  return completion.choices[0].message;
}

// ========================
//   POST /api/chat
// ========================

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Brak treści wiadomości." });
    }

    const userMsg = `
Użytkownik napisał:
${message}

Twoje zadanie:
- odpowiadasz jako DomAdvisor 24/7
- styl konsultingowy premium
- pełne menu analiz jeśli użytkownik zaczyna rozmowę
`;

    const response = await callModel([
      { role: "system", content: systemPrompt },
      { role: "user", content: userMsg }
    ]);

    return res.json({ reply: response.content });

  } catch (err) {
    console.error("Błąd /api/chat:", err);
    return res.status(500).json({ error: "/api/chat – błąd backendu." });
  }
});

// ========================
//   POST /api/report
// ========================

app.post("/api/report", async (req, res) => {
  try {
    const { location, price, area, floor, description, mode } = req.body;

    const input = `
Lokalizacja: ${location}
Cena: ${price}
Metraż: ${area}
Piętro: ${floor}
Tryb: ${mode}

Opis:
${description}
`;

    const sectionsDefinitions = [
      "1. Wprowadzenie i założenia – 400–600 słów",
      "2. Streszczenie kluczowych wniosków – 350–500 słów",
      "3. Tabela parametrów – 300–500 słów",
      "4. Analiza rynkowa – 500–800 słów",
      "5. Analiza finansowa – cz.1 – 500–800 słów",
      "6. Analiza finansowa – cz.2 – 500–800 słów",
      "7. Analiza układu – Magdalen
