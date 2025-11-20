import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =======================================
//  OPENAI – GPT-5.1 + BROWSING
// =======================================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// =======================================
//  SYSTEM PROMPT – WIEDZA (WERSJA 2 – ZOPTYMALIZOWANA)
// =======================================

const systemPrompt = `
Jesteśmy DomAdvisor – duetem ekspertów AI działających 24/7. Pełnimy rolę dwóch specjalistów:

Jakub – ekspert analizy finansowej i inwestycyjnej.
Zakres: analiza cen rynkowych, median i trendów, ROI, cap rate, cashflow, DSCR, okres zwrotu, benchmarking, opłacalność zakupu i najmu, analiza flipów i kosztów remontu, interpretacja różnic cenowych oraz ryzyk finansowych. Styl: liczbowy, precyzyjny, oparty wyłącznie na danych publicznych. Jakub nigdy nie zgaduje cyfr – jeśli dane nie istnieją, podaje wąskie widełki interpretacyjne.

Magdalena – ekspertka układu, architektury i estetyki.
Zakres: układ funkcjonalny, ergonomia, światło, ekspozycja, proporcje, ustawność, stylistyka wnętrz, standard wykończenia, analiza zdjęć, ocena widocznego stanu technicznego, identyfikacja mocnych stron i ograniczeń, liftingi i remonty A/B/C. Styl: klarowny, wizualny, spójny, elegancki.

Zawsze piszemy w pierwszej osobie liczby mnogiej, neutralnie i profesjonalnie (styl konsultingowy premium).

ZASADY OGÓLNE
• Każdy raport: 4000–6000 słów.
• Oparcie wyłącznie na danych publicznych.
• Oddzielanie danych pewnych od interpretacji.
• Zero przewidywania przyszłych cen.
• Zero rekomendacji inwestycyjnych (kup/sprzedaj).
• Wskazywanie scenariuszy i logiki.
• Użytkownik może wpisać "0", aby wrócić do MENU.
• DomAdvisor = narzędzie edukacyjne.

BROWSING – ZASADY
Kiedy analiza dotyczy cen, median, trendów, stawek najmu, kosztów remontu, ROI – MUSIMY pobrać dane publiczne przez browsing (web.run).
Jeśli dane nie istnieją → komunikujemy to i podajemy wąskie widełki interpretacyjne.
Treści ogłoszeń dostarcza użytkownik.
Nie pobieramy treści z portali, które blokują odczyt (Otodom, Morizon). Nie scrapujemy.

HIERARCHIA PUBLICZNYCH ŹRÓDEŁ
Polska: SonarHome, Adresowo, TabelaOfert, Otodom Analytics, AMRON-SARFiN, Cenatorium, RCiWN, NBP, GUS.
Hiszpania: Idealista, Fotocasa, INE, Banco de España, Eurostat.
Dubaj: Bayut, Property Finder, Dubai Land Department, DSC.

KOSZTY REMONTÓW A/B/C
Polska: A 200–450 zł/m², B 800–1500 zł/m², C 1500–3000 zł/m² (inwest.), 3000–5000 zł/m² (premium)
Hiszpania: A 25–60 €/m², B 800–1200 €/m², C 1000–1800 €/m² / 1800–3000 €/m²
Dubaj: A 1000–2000 AED/m², B 3000–6000 AED/m², C 6000–10000 / 10000–15000 AED/m²

PROGI INTERPRETACYJNE
ROI ≥ 12%
Cap rate ≥ 5.5%
CoC ≥ 8%
DSCR ≥ 1.25
Różnica ceny/m² vs mediana: 0–5% zgodne, 5–10% wysoki standard, 10%+ sygnał atrakcyjności.

STRUKTURA RAPORTU 10-CHUNKOWEGO
1. Wprowadzenie i założenia  
2. Streszczenie kluczowych wniosków  
3. Tabela parametrów  
4. Analiza rynkowa  
5. Analiza finansowa (Jakub) cz.1  
6. Analiza finansowa (Jakub) cz.2  
7. Analiza układu (Magdalena)  
8. Scenariusze A/B/C  
9. Ryzyka  
10. Wnioski końcowe + klasyfikacja + źródła  

Każda sekcja musi być zamknięta, kompletna, spójna, edukacyjna.

MENU ANALIZ
1. Profil idealnej nieruchomości
2. Przegląd rynku zakupu
3. Analiza ogłoszenia kupna
4. Analiza ogłoszenia najmu
5. Przegląd rynku najmu
6. Przygotowanie ogłoszenia sprzedaży
7. Flip – koszt remontu i ROI
8. Inwestycja pod wynajem
9. Najem krótkoterminowy / Airbnb
10. Lifting mieszkania A/B/C
11. Dlaczego mieszkanie się nie wynajmuje?
12. Analizy zagraniczne (Hiszpania / Dubaj)

MISJA
Tworzymy najbardziej merytoryczne, oparte na danych analizy nieruchomości, bez nacisku i bez wskazywania jednego właściwego scenariusza.
`;

// ==================================================
//  HELPER – WYWOŁANIE MODELU GPT-5.1 + WEB.RUN
// ==================================================

async function callModel(messages, maxTokens = 4500) {
  const completion = await client.chat.completions.create({
    model: "gpt-5.1",
    messages,
    max_tokens: maxTokens,
    temperature: 0.2,
    tools: [
      {
        type: "web_run",
        name: "web.run"
      }
    ]
  });

  const choice = completion.choices[0];

  if (choice.message.tool_calls?.length) {
    return choice;
  }

  return choice.message;
}

// ==================================================
//  ENDPOINT: /api/chat – konsultacje + MENU
// ==================================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Brak treści wiadomości." });
    }

    const userMsg = `
Użytkownik napisał:
${message}

Twoje zadanie:
– odpowiedz jako DomAdvisor 24/7 zgodnie z WIEDZA,
– styl consulting premium,
– bez small talku,
– 1 osoba liczby mnogiej,
– odpowiedź zawsze kompletna.`;

    const reply = await callModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg }
      ],
      3500
    );

    res.json({ reply: reply.content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "/api/chat – błąd backendu." });
  }
});

// ==================================================
//  ENDPOINT: /api/report – RAPORT 10 CHUNKÓW
// ==================================================

app.post("/api/report", async (req, res) => {
  try {
    const { location, price, area, floor, description, mode } = req.body || {};

    const input = `
DANE OFERTY:

Lokalizacja: ${location || "brak"}
Cena: ${price || "brak"}
Metraż: ${area || "brak"}
Piętro: ${floor || "brak"}
Tryb analizy: ${mode || "brak"}

Treść ogłoszenia:  
${description || "brak"}
`;

    const chunkPromptList = [
      "1. Wprowadzenie i założenia – 400–600 słów",
      "2. Streszczenie kluczowych wniosków – 350–500 słów",
      "3. Dane ogólne + tabela parametrów – 300–500 słów",
      "4. Analiza rynkowa – 500–800 słów",
      "5. Analiza finansowa – część 1 – 500–800 słów",
      "6. Analiza finansowa – część 2 – 500–800 słów",
      "7. Analiza układu – Magdalena – 600–900 słów",
      "8. Scenariusze działania A/B/C – 400–700 słów",
      "9. Ryzyka – techniczne, rynkowe, formalne – 400–700 słów",
      "10. Wnioski końcowe + klasyfikacja + źródła – 400–700 słów"
    ];

    const sections = [];

    for (const instruction of chunkPromptList) {
      const reqMsg = `
DANE WEJŚCIOWE:
${input}

Napisz sekcję:
${instruction}

Wymagania:
– struktura zgodna z dokumentem WIEDZA,
– użyj browsing (web.run) do pobrania aktualnych danych rynkowych,
– zero przewidywania cen,
– sekcja zamknięta, kompletna, profesjonalna.`;

      const response = await callModel(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: reqMsg }
        ],
        4500
      );

      sections.push(response.content);
    }

    const report = sections.join("\n\n");

    res.json({ sections, report });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "/api/report – błąd backendu." });
  }
});

// ==================================================
//  START SERVERA
// ==================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("DomAdvisor 24/7 – GPT-5.1 + browsing – backend działa na porcie", PORT)
);
