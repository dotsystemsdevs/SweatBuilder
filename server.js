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

const SYSTEM_PROMPT = `You are a training coach. Calm, supportive, non-judgmental.

Principles:
- Consistency over intensity
- Small steps are enough
- Rest is training

Style:
- Short answers
- No exclamation marks
- No hype or motivation

You ONLY respond with JSON when requested.`;

// Fallbacks
const FALLBACKS = {
  interpretGoal: {
    goal_type: "unknown",
    sport: "unknown",
    confidence: "low",
    needs_followup: true,
  },
  eventFollowup: {
    question: "What event are you aiming for?",
  },
  generatePlan: {
    plan: {
      weeks: 4,
      days_per_week: 3,
      schedule: [],
    },
    explanation: "Could not generate plan right now.",
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
          event_name: "What event are you aiming for?",
          event_date: "When is the event?",
          sport: "What sport is it?",
        };

        const question = questions[missingInfo] || "Tell me more about your goal.";
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

        const prompt = `Create a training program. Return ONLY JSON.

Input:
- Goal type: ${goal_type || "general_fitness"}
- Sport: ${sport || "unknown"}
- Event: ${event_name || "none specific"}
- Date: ${event_date || "none"}
- Weeks left: ${weeks_until_event || "unknown"}
- Current training: ${current_training || "unknown"}
- Days/week: ${days_per_week || 3}
- Injuries: ${injuries || "none"}
- Equipment: ${tools || "none"}

Rules:
- Consistency over intensity
- Include rest days
- Realistic for everyday life
- Max ${days_per_week || 3} training days per week

Format:
{
  "plan": {
    "weeks": number,
    "days_per_week": number,
    "schedule": [
      {
        "week": 1,
        "days": [
          { "day": "Monday", "type": "training | rest", "description": "short description" }
        ]
      }
    ]
  },
  "explanation": "Max 5 sentences about the plan"
}`;

        const text = await callAI(SYSTEM_PROMPT, prompt, 2048);
        const parsed = safeJsonParse(text);
        return res.json({ ok: true, data: parsed || FALLBACKS.generatePlan });
      }

      // ==================== SUMMARY ====================
      case "SUMMARY": {
        const { plan, goal_type, sport, event_name, weeks_until_event } = payload || {};

        const summaryPrompt = `Explain this training plan calmly and clearly to the user.

Plan:
- Goal: ${goal_type || "general training"}
- Sport: ${sport || "unknown"}
- Event: ${event_name || "none specific"}
- Weeks: ${weeks_until_event || "flexible"}
- Days per week: ${plan?.days_per_week || 3}

Write 3-4 sentences that explain:
1. What the plan prioritizes
2. Why it's realistic
3. What's intentionally kept light

ALWAYS end with this exact question:
"Does this feel realistic for you?"

No hype. No technical jargon. Calm tone.`;

        const text = await callAI(SYSTEM_PROMPT, summaryPrompt, 512);
        const summary = text || "The plan focuses on building a sustainable routine. Does this feel realistic for you?";
        return res.json({ ok: true, data: { summary } });
      }

      // ==================== CONFIRM ====================
      case "CONFIRM": {
        // No AI needed - just acknowledge
        return res.json({
          ok: true,
          data: {
            confirmed: true,
            message: "This is just a starting point. We'll adjust the plan as we go.",
          },
        });
      }

      // ==================== CHAT ====================
      case "CHAT": {
        const { message, context } = payload || {};
        if (!message) {
          return res.json({ ok: true, data: { reply: "What's on your mind?" } });
        }

        const chatPrompt = `User says: "${message}"

${context ? `Context: ${context}` : ""}

Respond briefly and helpfully. Focus on training and health. Max 2-3 sentences.`;

        const text = await callAI(SYSTEM_PROMPT, chatPrompt, 256);
        const reply = text || "I didn't quite catch that. Can you say it again?";
        return res.json({ ok: true, data: { reply } });
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
