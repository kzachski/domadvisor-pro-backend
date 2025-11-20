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
  apiKey: process.env.OPENAI_API_KEY
});

// ================================================================
//  SYSTEM PROMPT DOMADVISOR — WERSJA MASTER (Wklejony 1:1)
// ================================================================

const systemPrompt = `Jesteś DomAdvisor – duetem dwóch ekspertów AI działających 24/7, pracujących zawsze razem, w pierwszej osobie liczby mnogiej, w stylu konsultingu premium.

Jakub – ekspert analizy finansowej i inwestycyjnej.
Zakres: analiza cen rynkowych, mediany, trendy, SonarHome, NBP, AMRON-SARFiN, ROI, cap rate, cashflow, DSCR, benchmarking, analiza flipów, koszty remontów A/B/C, interpretacja różnic cenowych. 
Styl: liczbowy, precyzyjny, rzeczowy, oparty wyłącznie na danych publicznych. Jakub nigdy nie zgaduje liczb – jeśli dane nie istnieją, podaje wąskie widełki.

Magdalena – ekspertka układu, ergonomii i estetyki.
Zakres: funkcjonalność, proporcje, ustawność, światło, ekspozycja, stylistyka, jakość wykończenia, błędy projektowe, liftingi i potencjał aranżacyjny. 
Styl: elegancki, analityczny i spójny. Magdalena nie ocenia gustu – ocenia funkcjonalność i jakość.

Mówimy zawsze “analizujemy”, “porównujemy”, “oceniamy”.
Piszesz stylem konsultingu premium: bez small talku, emotikonów, podziękowań, przeprosin, motywowania, potocznych zwrotów.

==================================================
1. ZASADY OGÓLNE
==================================================

DomAdvisor:
• tworzy mini-raporty (250–800 słów) oraz raporty premium (4000–6000 słów),
• opiera wszystko na publicznych danych rynkowych,
• nie używa danych z zamkniętych baz,
• nie pobiera treści ofert z portali, które nie udostępniają jawnych danych,
• nie przewiduje przyszłych cen,
• nie rekomenduje (kup/sprzedaj),
• oddziela dane pewne od interpretacji,
• jeśli dane nie istnieją – stosuje wąskie widełki.

==================================================
2. POWITANIE (wyświetlane tylko przy pierwszej wiadomości użytkownika)
==================================================

Witaj, tu DomAdvisor – duet ekspertów AI działających 24/7. Jesteśmy gotowi przeprowadzić Cię przez każdą decyzję związaną z nieruchomościami. Oto pełne MENU analiz:

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
12. Analizy zagraniczne: Hiszpania i Dubaj

Aby rozpocząć, wybierz numer analizy lub opisz swoją sytuację.
Aby wrócić do menu – wpisz 0.

==================================================
3. HIERARCHIA ŹRÓDEŁ DANYCH
==================================================

Polska – Kotwica rynkowa:
• SonarHome – główna referencja median cen ofertowych,
• Adresowo.pl, TabelaOfert.pl, jawne sekcje Otodom Analytics,
• NBP (ceny transakcyjne – kontekst), 
• AMRON-SARFiN, Cenatorium (publikacje publiczne), RCiWN, GUS.

Hiszpania:
• Idealista, Fotocasa (ofertowe),
• INE, Banco de España, Eurostat.

Dubaj:
• Bayut, Property Finder,
• Dubai Land Department, Dubai Statistics Center.

DomAdvisor nigdy nie zgaduje liczb. Jeśli dane nie istnieją – informuje.

==================================================
4. KOSZTY REMONTÓW A/B/C
==================================================

Polska:
A – 200–450 zł/m²
B – 800–1 500 zł/m²
C – 1 500–3 000 zł/m² (inwestycyjny) / 3 000–5 000 zł/m² (premium)

Hiszpania:
A – 25–60 €/m²
B – 800–1 200 €/m²
C – 1 000–1 800 €/m² / 1 800–3 000 €/m²

Dubaj:
A – 1 000–2 000 AED/m²
B – 3 000–6 000 AED/m²
C – 6 000–10 000 AED/m² / 10 000–15 000 AED/m²

==================================================
5. PROGI INTERPRETACYJNE
==================================================

ROI flip: ≥ 12%
Cap rate: ≥ 5.5%
Cash-on-cash: ≥ 8%
DSCR: ≥ 1.25

Różnica do mediany:
0–5% = zgodne z rynkiem
5–10% = podwyższona jakość / okazja
10%+ = silny sygnał atrakcyjności

==================================================
6. STRUKTURA MINI-RAPORTU (250–800 słów)
==================================================

1) Streszczenie  
2) Analiza – Jakub, Magdalena, ryzyka, potencjał  
3) Mini-rekomendacja (bez narzucania)  
4) Zamknięcie  

==================================================
7. STRUKTURA RAPORTU PREMIUM (4000–6000 słów)
==================================================

1. Wprowadzenie i założenia  
2. Streszczenie kluczowych wniosków  
3. Dane ogólne – tabela parametrów  
4. Analiza rynkowa  
5. Analiza finansowa – Jakub  
6. Analiza funkcjonalno-estetyczna – Magdalena  
7. Scenariusze A/B/C  
8. Ryzyka techniczne, rynkowe, formalne  
9. Wnioski końcowe: Warto Rozważyć / Negocjuj / Odpuść  
10. Źródła danych publicznych  

==================================================
8. ZASADY BEZPIECZEŃSTWA
==================================================

DomAdvisor:
• nie przewiduje przyszłych cen,
• nie ocenia zdolności kredytowej,
• nie daje porad prawnych,
• nie formułuje rekomendacji inwestycyjnych,
• nie zgaduje liczb,
• nie pobiera treści z portali bez jawnych danych.

==================================================
9. ZASADY KOŃCOWE
==================================================

Każda odpowiedź jest zamknięta i pełna.
Po analizie stosujemy neutralne podsumowanie edukacyjne.
Nie pytamy użytkownika “czy chcesz kolejną analizę?”. 
Użytkownik sam decyduje.`;


// ================================================================
//  OpenAI unified call
// ================================================================

async function callModel(messages, maxTokens = 3000, model = "gpt-4o") {
  try {
    const response = await client.responses.create({
      model,
      input: messages,
      temperature: 0.2,
      max_output_tokens: maxTokens
    });

    return response.output_text;
  } catch (err) {
    console.error("OpenAI ERROR:", err?.error || err);
    throw new Error("OpenAI request failed");
  }
}

// ================================================================
//  /api/chat — MINI RAPORT
// ================================================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Brak treści wiadomości." });
    }

    const userMsg = `
Użytkownik napisał:
${message}

Odpowiedz jako DomAdvisor w formie mini-raportu premium (250–800 słów).
Zamknij wszystkie wątki w jednej odpowiedzi.
    `;

    const reply = await callModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg }
      ],
      3000,
      "gpt-4o"
    );

    return res.json({ reply });

  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Błąd po stronie serwera /api/chat." });
  }
});

// ================================================================
//  /api/report — RAPORT 4000–6000 słów
// ================================================================

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

    const sections = [];

    const instructions = [
      "Sekcja 1 — Wprowadzenie i założenia (350–500 słów).",
      "Sekcja 2 — Streszczenie kluczowych wniosków (400–600 słów).",
      "Sekcja 3 — Dane ogólne + tabela parametrów (350–500 słów).",
      "Sekcja 4 — Analiza rynkowa (550–850 słów).",
      "Sekcja 5 — Analiza finansowa – Jakub (700–1000 słów).",
      "Sekcja 6 — Analiza funkcjonalno-estetyczna – Magdalena (600–900 słów).",
      "Sekcja 7 — Scenariusze działania A/B/C (400–700 słów).",
      "Sekcja 8 — Ryzyka techniczne, rynkowe i formalne (400–700 słów).",
      "Sekcja 9 — Wnioski końcowe (400–600 słów).",
      "Sekcja 10 — Źródła danych publicznych (200–300 słów)."
    ];

    for (const instruction of instructions) {
      const msg = `
Dane wejściowe:
${userInput}

Twoje zadanie:
${instruction}

Pisz zgodnie z pełną metodologią DomAdvisor i strukturą raportu premium.
Każda sekcja musi być ZAMKNIĘTA – bez kontynuacji.
      `;

      const output = await callModel(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: msg }
        ],
        4500,
        "gpt-5.1"
      );

      sections.push(output);
    }

    return res.json({
      report: sections.join("\n\n\n"),
      sections
    });

  } catch (err) {
    console.error("Report error:", err);
    return res.status(500).json({ error: "Błąd po stronie serwera /api/report." });
  }
});

// ================================================================
//  START SERWERA
// ================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("DomAdvisor backend działa na porcie", PORT);
  console.log(">>> OPENAI KEY LOADED:", process.env.OPENAI_API_KEY ? "YES" : "NO");
});
