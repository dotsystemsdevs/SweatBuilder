const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk").default;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Du är en träningscoach. Lugn, stöttande, utan att döma.

Principer:
- Konsistens före intensitet
- Små steg räcker
- Vila är träning

Stil:
- Korta svar
- Inga utropstecken
- Ingen hype eller motivation

Du svarar ENDAST med JSON när det efterfrågas.`;

// Fallbacks
const FALLBACKS = {
  interpretGoal: {
    goal_type: "unknown",
    sport: "unknown",
    confidence: "low",
    needs_followup: true,
  },
  eventFollowup: {
    question: "Vilket event siktar du på?",
  },
  generatePlan: {
    plan: {
      weeks: 4,
      days_per_week: 3,
      schedule: [],
    },
    explanation: "Kunde inte generera plan just nu.",
  },
};

// Safe JSON parse
function safeJsonParse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

// AI call wrapper
async function callAI(systemPrompt, userPrompt, maxTokens = 512) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock?.text || "";
  } catch (error) {
    console.error("[AI Error]", error.message);
    return null;
  }
}

// Health check
app.get("/", (req, res) => {
  res.send("OK");
});

// Main onboarding endpoint
app.post("/api/ai/onboarding", async (req, res) => {
  try {
    const { step, payload } = req.body || {};

    if (!step) {
      return res.status(400).json({ ok: false, error: "step is required" });
    }

    switch (step) {
      // ==================== PING ====================
      case "PING":
        return res.json({ ok: true });

      // ==================== INTERPRET_GOAL ====================
      case "INTERPRET_GOAL": {
        const goalText = payload?.goalText;
        if (!goalText) {
          return res.json({ ok: true, data: FALLBACKS.interpretGoal });
        }

        const prompt = `Analysera detta träningsmål och returnera ENDAST JSON:

Mål: "${goalText}"

Format:
{
  "goal_type": "event | general_fitness | comeback | unknown",
  "sport": "cycling | running | triathlon | gym | other | unknown",
  "confidence": "high | medium | low",
  "needs_followup": true | false
}`;

        const text = await callAI(SYSTEM_PROMPT, prompt, 256);
        const parsed = safeJsonParse(text);
        return res.json({ ok: true, data: parsed || FALLBACKS.interpretGoal });
      }

      // ==================== EVENT_FOLLOWUP ====================
      case "EVENT_FOLLOWUP": {
        const { missingInfo } = payload || {};
        // missingInfo can be: "event_name", "event_date", "sport"

        const questions = {
          event_name: "Vilket event siktar du på?",
          event_date: "När är eventet?",
          sport: "Vilken sport gäller det?",
        };

        const question = questions[missingInfo] || "Berätta mer om ditt mål.";
        return res.json({ ok: true, data: { question } });
      }

      // ==================== GENERATE_PLAN ====================
      case "GENERATE_PLAN": {
        const {
          goal_type,
          sport,
          event_name,
          event_date,
          weeks_until_event,
          current_training,
          days_per_week,
          injuries,
          tools,
        } = payload || {};

        const prompt = `Skapa ett träningsprogram. Returnera ENDAST JSON.

Input:
- Måltyp: ${goal_type || "general_fitness"}
- Sport: ${sport || "unknown"}
- Event: ${event_name || "inget specifikt"}
- Datum: ${event_date || "inget"}
- Veckor kvar: ${weeks_until_event || "okänt"}
- Tränar nu: ${current_training || "okänt"}
- Dagar/vecka: ${days_per_week || 3}
- Skador: ${injuries || "inga"}
- Verktyg: ${tools || "inga"}

Regler:
- Konsistens före intensitet
- Inkludera vilodar
- Realistiskt för vanligt liv
- Max ${days_per_week || 3} träningsdagar per vecka

Format:
{
  "plan": {
    "weeks": number,
    "days_per_week": number,
    "schedule": [
      {
        "week": 1,
        "days": [
          { "day": "Måndag", "type": "träning | vila", "description": "kort beskrivning" }
        ]
      }
    ]
  },
  "explanation": "Max 5 meningar om planen"
}`;

        const text = await callAI(SYSTEM_PROMPT, prompt, 2048);
        const parsed = safeJsonParse(text);
        return res.json({ ok: true, data: parsed || FALLBACKS.generatePlan });
      }

      // ==================== DEFAULT ====================
      default:
        return res.json({ ok: true, step: step || "unknown" });
    }
  } catch (error) {
    console.error("[Handler Error]", error.message);
    return res.status(500).json({ ok: false, error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
