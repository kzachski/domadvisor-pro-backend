import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ======================================================
//  OPENAI CLIENT – używamy Threads API (GPT-s)
// ======================================================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Twój GPT-s
const ASSISTANT_ID = "asst_2yfBUCL99rc5zM3O9evguBwn";

// ======================================================
//  /api/chat — pełny dialog, identyczny jak w GPT-s
// ======================================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message, threadId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Brak treści wiadomości." });
    }

    let thread;

    // jeśli nie ma thread → utwórz nowy (jak ChatGPT)
    if (!threadId) {
      thread = await client.beta.threads.create();
    } else {
      thread = { id: threadId };
    }

    // dodaj wiadomość użytkownika
    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });

    // uruchom asystenta (GPT-s)
    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    // czekamy aż model skończy
    let result;
    while (true) {
      result = await client.beta.threads.runs.retrieve(thread.id, run.id);

      if (result.status === "completed") break;
      if (result.status === "failed") {
        return res.status(500).json({
          error: "Asystent nie mógł wygenerować odpowiedzi."
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    // pobierz odpowiedź
    const messages = await client.beta.threads.messages.list(thread.id);

    const last = messages.data[0].content[0].text.value;

    return res.json({
      success: true,
      reply: last,
      threadId: thread.id
    });

  } catch (err) {
    console.error("/api/chat error:", err);
    return res.status(500).json({
      error: "Błąd serwera w /api/chat."
    });
  }
});

// ======================================================
//  START SERVERA
// ======================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 DomAdvisor + GPT-s działa!");
  console.log("🌐 Port:", PORT);
  console.log(
    "🔑 OPENAI KEY:",
    process.env.OPENAI_API_KEY ? "OK" : "BRAK!"
  );
  console.log("🤖 Assistant:", ASSISTANT_ID);
});
