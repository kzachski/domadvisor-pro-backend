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

const systemPrompt = `
Jesteśmy DomAdvisor – duetem ekspertów AI działających 24/7.
(TU WKLEJ CAŁY TEKST WIEDZA — W JEDNYM BLOKU, BEZ PRZERYWANIA)
`;

// ========================
//   POPRAWNA FUNKCJA GPT-5.1
// ========================

async function callModel(messages, maxTokens = 4500) {
  const completion = await client.chat.completions.create({
    model: "gpt-5.1",
    messages,
    max_tokens: maxTokens,
    temperature: 0.2,
    web: { search: true }
  });

  return completion.choices[0].message;
}

// ========================
//      /api/chat
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
- pełne menu analiz przy starcie rozmowy
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
//       /api/report
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

    const sections = [
      "1. Wprowadzenie i założenia",
      "2. Streszczenie kluczowych wniosków",
      "3. Tabela parametrów",
      "4. Analiza rynkowa",
      "5. Analiza finansowa – część 1",
      "6. Analiza finansowa – część 2",
      "7. Analiza układu – Magdalena",
      "8. Scenariusze A/B/C",
      "9. Ryzyka",
      "10. Wnioski końcowe + źródła"
    ];

    const output = [];

    for (const sec of sections) {
      const msg = `
DANE OFERTY:
${input}

Napisz sekcję:
${sec}

Zasady:
– korzystaj z browsing,
– styl DomAdvisor,
– 400–900 słów,
– sekcja zamknięta i kompletna.
`;

      const response = await callModel([
        { role: "system", content: systemPrompt },
        { role: "user", content: msg }
      ]);

      output.push(response.content);
    }

    return res.json({
      sections: output,
      report: output.join("\n\n")
    });

  } catch (err) {
    console.error("Błąd /api/report:", err);
    return res.status(500).json({ error: "/api/report – błąd backendu." });
  }
});

// ========================
//   START SERVERA
// ========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`DomAdvisor backend działa na porcie ${PORT}`);
});
