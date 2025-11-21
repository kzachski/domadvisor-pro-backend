// ================================================================
//  DomAdvisor — Backend Premium (Wersja Lekka & Stabilna)
// ================================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================================================================
//  OPENAI CLIENT
// ================================================================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ================================================================
//  SYSTEM PROMPT — WERSJA LEKKA, PREMIUM, STABILNA
// ================================================================

const systemPrompt = `
Jesteś systemem analitycznym DOMADVISOR — ekspertem ds. nieruchomości, rzeczoznawcą i doradcą inwestycyjnym działającym jak duet:

• Jakub — analityk finansowy (ROI, cap rate, DSCR, flipping, koszty remontów, analiza cen)
• Magdalena — architekt wnętrz i ekspert ergonomii (układ, światło, estetyka, liftingi A/B/C)

Styl:
– konsultingowy premium,
– spokojny, analityczny, precyzyjny,
– brak emotikonów i potocznego języka,
– obszerne odpowiedzi pełne danych i logiki.

Zawsze generujesz raport premium 4000–7000 słów według struktury:

1. Streszczenie oferty / dane ogólne  
2. Analiza rynkowa (mediany, trendy, kontekst lokalizacji)  
3. Analiza finansowa (Jakub)  
4. Analiza funkcjonalno–estetyczna (Magdalena)  
5. Ryzyka  
6. Rekomendacja końcowa (neutralna, bez “kup/sprzedaj”)  
7. Źródła danych (NBP, Otodom Analytics, AMRON-SARFiN, GUS)  
8. Uwaga metodologiczna  

W analizie finansowej uwzględniaj:
– cena/m² vs mediana,
– ROI, cap rate, cashflow,
– DSCR (jeśli dotyczy),
– koszty remontów A/B/C,
– plan działań 30/60/90 dni.

W analizie Magdaleny uwzględniaj:
– układ funkcjonalny,
– światło i ekspozycję,
– proporcje i ustawność,
– estetykę i standard,
– potencjał liftingowy (A/B/C).

Jeśli dane rynkowe nie są dostępne, podawaj ostrożne widełki lub interpretację.
Nie przewidujesz przyszłych cen.
Nie wydajesz rekomendacji inwestycyjnych.

Każdy raport kończysz:
„Dane mają charakter edukacyjny i nie stanowią rekomendacji inwestycyjnej.”
`;

// ================================================================
//  FUNKCJA: WYWOŁANIE OPENAI
// ================================================================

async function callModel(messages, maxTokens = 8000) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.35,
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error("❌ OpenAI ERROR:", err?.error || err);
    return "Błąd generowania raportu.";
  }
}

// ================================================================
//  ENDPOINT: PEŁNY CZAT (1:1 zapytanie → kompleksowa odpowiedź)
// ================================================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Brak treści wiadomości." });
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    const reply = await callModel(messages, 6000);

    res.json({ success: true, reply });
  } catch (err) {
    console.error("/api/chat ERROR:", err);
    res.status(500).json({ success: false, error: "Błąd serwera." });
  }
});

// ================================================================
//  ENDPOINT: RAPORT PREMIUM
// ================================================================

app.post("/api/report", async (req, res) => {
  try {
    const { location, price, area, floor, description } = req.body || {};

    const input = `
Lokalizacja: ${location || "brak"}
Cena: ${price || "brak"}
Metraż: ${area || "brak"}
Piętro: ${floor || "brak"}
Opis:
${description || "brak"}
`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Wygeneruj pełny raport premium dla nieruchomości na podstawie danych:\n${input}`,
      },
    ];

    const report = await callModel(messages, 8000);

    res.json({ success: true, report });
  } catch (err) {
    console.error("/api/report ERROR:", err);
    res.status(500).json({ success: false, error: "Błąd serwera raportu." });
  }
});

// ================================================================
//  START SERVERA
// ================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 DomAdvisor — Backend Premium działa");
  console.log("🌐 Port:", PORT);
  console.log("🔑 Klucz OpenAI:", process.env.OPENAI_API_KEY ? "OK" : "BRAK!");
});
