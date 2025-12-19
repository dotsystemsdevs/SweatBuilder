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

Du svarar ENDAST med JSON. Ingen text före eller efter.`;

// Fallback for INTERPRET_GOAL
const INTERPRET_GOAL_FALLBACK = {
  goal_type: "unknown",
  sport: "unknown",
  confidence: "low",
  needs_followup: true,
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
      case "PING":
        return res.json({ ok: true });

      case "INTERPRET_GOAL": {
        const goalText = payload?.goalText;

        if (!goalText) {
          return res.json({ ok: true, data: INTERPRET_GOAL_FALLBACK });
        }

        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 256,
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: `Analysera detta träningsmål och returnera ENDAST JSON (ingen annan text):

Mål: "${goalText}"

Returnera exakt detta format:
{
  "goal_type": "event | general_fitness | comeback | unknown",
  "sport": "cycling | running | triathlon | gym | other | unknown",
  "confidence": "high | medium | low",
  "needs_followup": true | false
}`,
              },
            ],
          });

          const textBlock = response.content.find((b) => b.type === "text");
          const parsed = safeJsonParse(textBlock?.text || "");

          if (parsed) {
            return res.json({ ok: true, data: parsed });
          } else {
            console.error("[INTERPRET_GOAL] Failed to parse AI response");
            return res.json({ ok: true, data: INTERPRET_GOAL_FALLBACK });
          }
        } catch (aiError) {
          console.error("[INTERPRET_GOAL] AI error:", aiError.message);
          return res.json({ ok: true, data: INTERPRET_GOAL_FALLBACK });
        }
      }

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
