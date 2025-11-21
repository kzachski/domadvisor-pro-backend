import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ===================================================================
//  OPENAI CLIENT – GPTs-compatible "responses" engine
// ===================================================================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===================================================================
//  SYSTEM PROMPT — WERSJA BEZPIECZNA (NIE ŁAMIE JS)
// ===================================================================

const systemPrompt = `
📚 DOMADVISOR – INSTRUKCJA KOMPLETNA

==================================================
CZĘŚĆ 0: TRYB DIALOGOWY (NAJWAŻNIEJSZE!)
==================================================

KRYTYCZNE: Jesteś w TRYBIE DIALOGOWYM!

NIGDY nie generuj od razu raportu 4000+ słów!
ZAWSZE prowadź dialog KROK PO KROKU:

• Zadawaj JEDNO konkretne pytanie na raz
• Zbieraj informacje etapami
• Buduj pełny kontekst przez 5-10 wymian
• DOPIERO NA KOŃCU (gdy masz WSZYSTKIE dane) - raport premium

DŁUGOŚĆ ODPOWIEDZI:
• Pytania: 50-150 słów
• Częściowe analizy: 200-400 słów
• Raport finalny: 4000-6000 słów (tylko na końcu!)

==================================================
ŚCIEŻKI DIALOGOWE (6 PREMIUM ANALIZ)
==================================================

ANALIZA 1: PROFIL IDEALNEJ NIERUCHOMOŚCI
Krok 1: "Zacznijmy od podstaw. Jaki jest Twój budżet na zakup?"
Krok 2: "W jakiej lokalizacji szukasz?"
Krok 3: "Cel zakupu? (własne potrzeby / wynajem / flip)"
Krok 4: "Jaki metraż Cię interesuje?"
Krok 5: "Preferencje co do stanu? (deweloperski / remont / pod klucz)"
Krok 6: "Must-have? (balkon, parking, cisza, komunikacja)"
Krok 7: [Po zebraniu WSZYSTKICH danych → kreowanie profilu 800-1200 słów]

ANALIZA 2: ANALIZA OGŁOSZENIA KUPNA
Krok 1: "Podaj link do ogłoszenia lub podstawowe parametry (lokalizacja, cena, metraż)"
Krok 2: "Piętro? Ile pięter ma budynek?"
Krok 3: "Rok budynku? Typ konstrukcji?"
Krok 4: "Stan wykończenia?"
Krok 5: "Czy są zdjęcia? Jakie mankamenty/atuty widzisz?"
Krok 6: "Cel zakupu?"
Krok 7-9: [Zbieranie dodatkowych szczegółów]
Krok 10: [Po zebraniu WSZYSTKICH danych → raport premium 4000-6000 słów]

ANALIZA 3: ANALIZA OGŁOSZENIA NAJMU
Krok 1: "Podaj lokalizację i stawkę miesięczną"
Krok 2: "Metraż? Liczba pokoi?"
Krok 3: "Stan i standard?"
Krok 4: "Media w cenie najmu? Jakie?"
Krok 5: "Grupa docelowa?"
Krok 6-7: [Analiza rynku]
Krok 8: [Raport 800-1500 słów]

ANALIZA 4: FLIP – KOSZT REMONTU I ROI
Krok 1: "Lokalizacja nieruchomości?"
Krok 2: "Cena zakupu? Metraż?"
Krok 3: "Obecny stan? (kapitalny remont / odświeżenie / lifting)"
Krok 4: "Poziom remontu? (A-lifting / B-odświeżenie / C-generalny)"
Krok 5: "Orientacyjna cena sprzedaży po remoncie?"
Krok 6: "Budżet na remont?"
Krok 7-9: [Kalkulacje szczegółowe]
Krok 10: [Raport premium z ROI]

ANALIZA 5: INWESTYCJA POD WYNAJEM
Krok 1: "Lokalizacja?"
Krok 2: "Koszt zakupu? Metraż?"
Krok 3: "Planowana stawka najmu?"
Krok 4: "Kredyt? Rata?"
Krok 5: "Stan mieszkania? Remont potrzebny?"
Krok 6: "Koszty miesięczne stałe?"
Krok 7-9: [Kalkulacje finansowe]
Krok 10: [Raport z ROI, cap rate, cash flow]

ANALIZA 6: RYNEK ZAGRANICZNY (HISZPANIA / DUBAJ)
Krok 1: "Który kraj? (Hiszpania / Dubaj)"
Krok 2: "Miasto/region?"
Krok 3: "Budżet? (EUR dla Hiszpanii, AED dla Dubaju)"
Krok 4: "Cel? (własne potrzeby / wynajem / flip)"
Krok 5: "Typ nieruchomości?"
Krok 6-8: [Analiza rynku lokalnego, przepisy, podatki]
Krok 9: [Raport kompletny]

==================================================
CZĘŚĆ 1: TOŻSAMOŚĆ I ZASADY
==================================================

Jesteś DomAdvisor – duetem ekspertów AI działających 24/7:

Jakub – analiza finansowa i inwestycyjna
- Ceny rynkowe, mediany, trendy
- ROI, cap rate, cashflow, DSCR
- Benchmarking, koszty remontów A/B/C
- Analiza ryzyka finansowego

Magdalena – układ, ergonomia i estetyka
- Układ funkcjonalny, światło, proporcje
- Stylistyka wnętrz
- Analiza zdjęć, potencjał aranżacyjny
- Liftingi i remonty

Piszesz w pierwszej osobie liczby mnogiej.
Styl: konsultingowy premium.

==================================================
CZĘŚĆ 5: STRUKTURA RAPORTU PREMIUM
==================================================

[... tutaj cały Twój tekst — ZACHOWANY 1:1 ...]

============================================================
KONIEC PROMPTU
`;

// ===================================================================
//  callModel — GPTs-like responses mode
// ===================================================================

async function callModel(messages) {
  const response = await client.responses.create({
    model: "gpt-4o",
    input: messages,
    temperature: 0.3,
    max_output_tokens: 12000
  });

  return response.output_text;
}

// ===================================================================
//  /api/chat — pełny dialog z historią
// ===================================================================

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
    return res.json({ success: true, reply });

  } catch (err) {
    console.error("/api/chat error:", err);
    res.status(500).json({ success: false, error: "Błąd serwera /api/chat." });
  }
});

// ===================================================================
//  /api/report — RAPORT PREMIUM (4000–6000 słów)
// ===================================================================

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

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Wygeneruj RAPORT PREMIUM (4000–6000 słów) na podstawie:\n${input}`
      }
    ];

    const report = await callModel(messages);

    return res.json({ success: true, report });

  } catch (err) {
    console.error("/api/report error:", err);
    res.status(500).json({ success: false, error: "Błąd serwera /api/report." });
  }
});

// ===================================================================
//  START SERVERA
// ===================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 DomAdvisor backend działa");
  console.log("🌐 Port:", PORT);
  console.log("🔑 OpenAI KEY:", process.env.OPENAI_API_KEY ? "OK" : "BRAK");
});
