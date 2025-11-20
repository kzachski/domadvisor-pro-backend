import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";

dotenv.config();

const app = express();
console.log(">>> OPENAI KEY LOADED:", process.env.OPENAI_API_KEY ? "YES" : "NO");

app.use(cors());
app.use(express.json());

// ========================
//   ŁADOWANIE WIEDZY
// ========================

let systemPrompt = "";

try {
  systemPrompt = fs.readFileSync("./knowledge", "utf8");
  console.log("Plik knowledge wczytany pomyślnie.");
} catch (err) {
  console.error("Błąd wczytywania pliku knowledge:", err);
  systemPrompt = "DomAdvisor — brak danych WIEDZA.";
}

// ========================
//   FUNKCJA GPT-5.1
// ========================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function callModel(messages, maxTokens = 4500) {
  const completion = await client.chat.completions.create({
    model: "gpt-5.1",
    messages,
    max_tokens: maxTokens,
    temperature: 0.2
    // browsing wyłączone, bo klucz nie obsługuje
  });

  return completion.choices[0].message;
}

// ========================
//   /api/chat
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
- odpowiadasz jako DomAdvisor 24/7,
- styl konsultingowy premium,
- rozpocznij rozmowę jak startowe menu usług.
`;

    const response = await callModel([
      { role: "system", content: systemPrompt },
      { role: "user", content: userMsg }
    ]);

    return res.json({ reply: response.content });

  } catch (err) {
    console.error("Błąd /api/chat:", err);
    return res.status(500).json({ error: "Błąd backendu /api/chat." });
  }
});

// ========================
//   /api/report
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
– styl DomAdvisor premium,
– 400–900 słów,
– sekcja kompletna i zamknięta.
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
    return res.status(500).json({ error: "Błąd backendu /api/report." });
  }
});

// ========================
//   START
// ========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`DomAdvisor backend działa na porcie ${PORT}`);
});

