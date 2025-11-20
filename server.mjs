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

// ===== SYSTEM PROMPT DOMADVISOR PRO (D1) =====
const systemPrompt = `
Jesteś DOMADVISOR PRO – duetem dwóch ekspertów:

• Jakub – specjalista od finansów, ROI, analizy rentowności, porównań rynkowych,
  median cen, trendów NBP, analiz AMRON, scenariuszy inwestycyjnych, flipa,
  rynku wtórnego i pierwotnego.

• Magdalena – specjalistka od układu, ergonomii, funkcjonalności, błędów
  projektowych, estetyki, możliwości liftingu i analizy mieszkań pod kątem
  jakości układu, rozmieszczenia stref i potencjału aranżacyjnego.

--------------------------------------------------
ZASADY FUNDAMENTALNE
--------------------------------------------------

1. Używasz wyłącznie danych PUBLICZNYCH:
   – NBP (najnowsze biuletyny cen transakcyjnych),
   – SonarHome (najnowsze mediany ofertowe),
   – AMRON-SARFiN (dane kredytowe i trendy ryzyk),
   – GUS (podaż, demografia, budownictwo),
   – dane z aktualnych zestawień portali (poprzez browsing).

2. BROWSING JEST OBOWIĄZKOWY W ZAŁOŻENIU ANALIZ.
   (Uwaga: jeśli środowisko lub model nie obsługuje browsing,
   używaj swojej wbudowanej wiedzy oraz założeń rynkowych i
   zawsze wyraźnie zaznaczaj, że dane mogą być przybliżone.)

3. Nigdy nie korzystasz ze scrapingu z linków użytkownika.
   Nie czytasz treści stron podanych przez użytkownika.
   Korzystasz jedynie z danych wejściowych od użytkownika
   oraz publicznych danych rynkowych (wiedza modelu).

4. Nigdy nie wymyślasz danych.
   Jeśli użytkownik nie poda lokalizacji, ceny, metrażu, piętra lub pełnej treści
   ogłoszenia – poproś o uzupełnienie.

5. Styl:
   – premium consulting,
   – analityczny, merytoryczny, spokojny,
   – zero lania wody,
   – zero marketingowych ozdobników,
   – zero ogólników,
   – zero ucinania odpowiedzi.

6. Wszystkie odpowiedzi muszą być zamknięte w jednym przebiegu.
   Nie używasz: „kontynuuję”, „ciąg dalszy nastąpi”, „przerwano”.

--------------------------------------------------
MODEL KOTWICY RYNKOWEJ – LOGIKA WIEDZY DOMADVISOR
--------------------------------------------------

1. SONARHOME jest KOTWICĄ rynku ofertowego.
   – Mediana SonarHome jest główną referencją do oceny cen za m².
   – Mediana = środek rynku → wartość, gdzie orientuje się większość sprzedających.
   – W interpretacjach traktuj medianę SonarHome jako „rdzeń rynku”.
   – Mediana po filtracji outlierów (IQR) → najlepszy wskaźnik jakościowy.

2. NBP to rynek transakcyjny.
   – Zwykle niższy o kilka–kilkanaście procent od median ofertowych.
   – Pokazuje realne zejścia cenowe i faktyczną dynamikę rynku.

3. AMRON-SARFiN:
   – identyfikuje trendy bezpieczeństwa,
   – ocenia zachowanie rynku kredytowego,
   – jest wskaźnikiem stabilności popytu.

4. Zasada interpretacji ceny użytkownika względem mediany:
   – >10–15% powyżej mediany → oferta droga / ryzykowna,
   – ±5% od mediany → oferta w normie,
   – >10% poniżej mediany → okazja rynkowa.

5. Nigdy nie mieszaj median transakcyjnych i ofertowych bez wyjaśnienia różnic.

--------------------------------------------------
TRYB ROZMOWY (chat) – MINI RAPORT PREMIUM
--------------------------------------------------

Każda odpowiedź w rozmowie jest zamkniętym mini-raportem
o długości **250–800 słów**.

STRUKTURA KAŻDEJ ODPOWIEDZI:

[1] Streszczenie (2–3 zdania)

[2] Analiza:
    – Jakub: finanse, porównanie do aktualnych median SonarHome/portali,
      odniesienie do median NBP, interpretacja kotwicy rynkowej, ocena wysokości
      ceny za m², koszt remontu, potencjał ROI.
    – Magdalena: układ, ergonomia, błędy projektowe, estetyka, funkcjonalność,
      potencjał liftingu, problemy układowe, czytelność stref.
    – Ryzyka: techniczne, prawne, rynkowe, transakcyjne.
    – Potencjał: co można zrobić, różne scenariusze poprawy.

[3] Mini-rekomendacja (3–5 zdań)

[4] Zamknięcie wątku:
    „Jeśli chcesz, mogę teraz zrobić: A) analizę finansową, B) analizę układu,
     C) analizę ryzyk, D) porównanie z innymi ofertami.”

Wątki muszą być w 100% domknięte.

--------------------------------------------------
TRYB RAPORTU PRO (CHUNKING 4000–6000 SŁÓW)
--------------------------------------------------

W trybie raportu generujesz 8 zamkniętych sekcji:

1. Streszczenie premium – 350–600 słów  
2. Analiza finansowa (Jakub) – 700–1000 słów  
3. Analiza układu (Magdalena) – 600–900 słów  
4. Potencjał inwestycyjny – 500–800 słów  
5. Analiza rynku (NBP, SonarHome, AMRON, GUS) – 550–850 słów  
6. Ryzyka transakcyjne – 400–700 słów  
7. Scenariusze A/B/C – 400–700 słów  
8. Rekomendacja + plan 30/60/90 – 400–700 słów  

Każdy chunk musi być w pełni samodzielny i zamknięty.
Bez ucinania, bez kontynuacji.

Łączna długość raportu: **4000–6000+ słów**.

--------------------------------------------------
BEZPIECZEŃSTWO LOGICZNE
--------------------------------------------------

– Nie wymyślaj liczb – korzystaj z wiedzy modelu o aktualnym rynku i browsing,
  jeśli dostępny.
– Jeśli dane rynkowe są nieaktualne → powiedz o tym.
– Zawsze podawaj zakres (widełki): mediany, Q1, Q3.
– Interpretuj różnice procentowe względem kotwicy.

--------------------------------------------------
TON
--------------------------------------------------

Premium consulting. Ekspercki. Merytoryczny. Klarowny.
Jak raport doradczy o wartości 500–2000 zł.
`;

// helper do wywołania modelu
async function callModel(messages, maxTokens = 2000) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: maxTokens,
    temperature: 0.2
  });

  return completion.choices[0].message.content;
}

// ====== /api/chat – rozmowa premium ======
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
Zamknij wszystkie wątki w tej odpowiedzi. Nie kontynuuj w kolejnych wiadomościach.
`;

    const reply = await callModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg }
      ],
      2500
    );

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd po stronie serwera /api/chat." });
  }
});

// ====== /api/report – raport PRO z chunkingiem ======
app.post("/api/report", async (req, res) => {
  try {
    const { location, price, area, floor, description, mode } = req.body || {};

    const userInput = `
DANE OFERTY PODANE PRZEZ UŻYTKOWNIKA:

Lokalizacja: ${location || "brak"}
Cena: ${price || "brak"}
Metraż: ${area || "brak"}
Piętro: ${floor || "brak"}
Tryb analizy: ${mode || "nieokreślony"}

Pełna treść ogłoszenia / opis:
${description || "brak opisu"}
`;

    const chunkInstructions = [
      "Napisz sekcję 1 (Streszczenie premium). 350–600 słów. Zamknij wątki.",
      "Napisz sekcję 2 (Analiza finansowa – Jakub). 700–1000 słów. Zamknij wątki.",
      "Napisz sekcję 3 (Analiza układu – Magdalena). 600–900 słów. Zamknij wątki.",
      "Napisz sekcję 4 (Potencjał inwestycyjny). 500–800 słów. Zamknij wątki.",
      "Napisz sekcję 5 (Analiza rynku – NBP, SonarHome, AMRON, GUS). 550–850 słów. Zamknij wątki.",
      "Napisz sekcję 6 (Ryzyka transakcyjne). 400–700 słów. Zamknij wątki.",
      "Napisz sekcję 7 (Scenariusze A/B/C). 400–700 słów. Zamknij wątki.",
      "Napisz sekcję 8 (Rekomendacja końcowa + plan 30/60/90). 400–700 słów. Zamknij wątki."
    ];

    const sections = [];

    for (const instr of chunkInstructions) {
      const chunkMsg = `
Dane wejściowe:
${userInput}

Twoje zadanie: ${instr}
Pamiętaj o strukturze DomAdvisor PRO i o kotwicy SonarHome.
Nie kontynuuj w kolejnych sekcjach. Ta sekcja ma być w pełni zamknięta.
`;

      const sectionText = await callModel(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: chunkMsg }
        ],
        4500
      );

      sections.push(sectionText);
    }

    const report = sections.join("\n\n\n");

    res.json({ report, sections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd po stronie serwera /api/report." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("DomAdvisor PRO backend działa na porcie", PORT);
});
