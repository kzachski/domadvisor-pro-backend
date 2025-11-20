import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================== OPENAI CLIENT ==================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ================== SYSTEM PROMPT ==================

const systemPrompt = `Jesteś DOMADVISOR PRO – duetem dwóch ekspertów:

• Jakub – finanse, ROI, mediany, NBP, AMRON, flip, analizy rynku.
• Magdalena – układ, ergonomia, funkcjonalność, błędy projektowe.

(... TWÓJ DUŻY SYSTEM PROMPT TUTAJ – NIE ZMIENIAM GO ...)
`;


// ================== UNIWERSALNE WYWOŁANIE MODELU ==================

async function callModel(messages, maxTokens = 3000, model = "gpt-4o") {
  try {
    const response = await client.responses.create({
      model,
      input: messages,                  // nowy format input
      temperature: 0.2,
      max_output_tokens: maxTokens      // nowy parametr
    });

    // responses API zwraca unified output_text
    return response.output_text;

  } catch (err) {
    console.error("OpenAI error:", err?.error || err);
    throw new Error("OpenAI request failed");
  }
}


// ================== /api/chat – MINI RAPORT ==================

app.post("/api/chat", async (req, res) => {
  try {
    const { message, mode } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Brak treści wiadomości." });
    }

    const userMsg = `
Użytkownik napisał:
${message}

Odpowiedz jako DomAdvisor PRO w formie mini-raportu premium (250–800 słów).
Zamknij wszystkie wątki. Nie kontynuuj w kolejnych odpowiedziach.
    `;

    const reply = await callModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg }
      ],
      3000,
      "gpt-4o"    // lub "gpt-5.1"
    );

    return res.json({ reply });

  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Błąd po stronie serwera /api/chat." });
  }
});


// ================== /api/report — RAPORT 4000–6000 SŁÓW ==================

app.post("/api/report", async (req, res) => {
  try {
    const { location, price, area, floor, description } = req.body || {};

    const userInput = `
DANE PODANE PRZEZ UŻYTKOWNIKA:

Lokalizacja: ${location || "brak"}
Cena: ${price || "brak"}
Metraż: ${area || "brak"}
Piętro: ${floor || "brak"}
Opis oferty:
${description || "brak"}
    `;

    const chunkInstructions = [
      "Sekcja 1 – Streszczenie premium (350–600 słów).",
      "Sekcja 2 – Analiza finansowa – Jakub (700–1000 słów).",
      "Sekcja 3 – Analiza układu – Magdalena (600–900 słów).",
      "Sekcja 4 – Potencjał inwestycyjny (500–800 słów).",
      "Sekcja 5 – Analiza rynku (NBP, SonarHome, AMRON, GUS) – 550–850 słów.",
      "Sekcja 6 – Ryzyka transakcyjne (400–700 słów).",
      "Sekcja 7 – Scenariusze A/B/C (400–700 słów).",
      "Sekcja 8 – Rekomendacja + plan 30/60/90 (400–700 słów)."
    ];

    const sections = [];

    for (const instruction of chunkInstructions) {
      const chunkMessage = `
Dane wejściowe:
${userInput}

Twoje zadanie:
${instruction}

Pisz zgodnie z metodologią DomAdvisor PRO.
Każda sekcja ma być ZAMKNIĘTA — nie kontynuujesz w następnych częściach.
      `;

      const section = await callModel(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: chunkMessage }
        ],
        4500,          // dużo miejsca
        "gpt-5.1"      // model idealny do długich raportów
      );

      sections.push(section);
    }

    const report = sections.join("\n\n\n");

    res.json({ report, sections });

  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ error: "Błąd po stronie serwera /api/report." });
  }
});


// ================== START SERWERA ==================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("DomAdvisor PRO backend działa na porcie", PORT);
  console.log(">>> OPENAI KEY LOADED:", process.env.OPENAI_API_KEY ? "YES" : "NO");
});
