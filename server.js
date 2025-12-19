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
    goal_type: "fitness",
    sport: "general",
    confidence: "low",
    needs_followup: false,
  },
  generatePlan: {
    plan: {
      weeks: 4,
      days_per_week: 3,
      schedule: [],
    },
    explanation: "Could not generate plan right now.",
  },
  trainingContext: {
    progression_style: "conservative",
    weekly_ramp: "slow",
    recovery_priority: "high",
    assumptions: [],
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

        const prompt = `Analyze this training goal and return ONLY JSON:

Goal: "${goalText}"

Format:
{
  "goal_type": "event | strength | fitness | other",
  "sport": "running | cycling | triathlon | gym | swimming | other",
  "confidence": "high | medium | low",
  "needs_followup": true | false
}

Rules:
- needs_followup = true ONLY if user mentions a specific race/event
- goal_type = "event" if they mention a race, marathon, competition
- goal_type = "strength" if they want to get stronger, lift more
- goal_type = "fitness" for general health, staying active
- goal_type = "other" if unclear`;

        const text = await callAI(SYSTEM_PROMPT, prompt, 256);
        const parsed = safeJsonParse(text);
        return res.json({ ok: true, data: parsed || FALLBACKS.interpretGoal });
      }

      // ==================== LOOKUP_EVENT ====================
      case "LOOKUP_EVENT": {
        const { eventName } = payload || {};
        if (!eventName) {
          return res.json({ ok: true, data: { found: false } });
        }

        const lookupPrompt = `Try to identify this sports event using your general knowledge.

Event name: "${eventName}"

Instructions:
- Use general knowledge only (no web search)
- If it's a well-known event (marathon, triathlon, cycling race, etc.), infer:
  - Official event name
  - Sport type
  - Typical distance(s)
  - Likely next/upcoming date (assume current or next year)
- Set confidence based on how sure you are
- Never invent obscure or fictional events
- If uncertain, set found: false

Return ONLY this JSON format:
{
  "found": true | false,
  "eventName": "Official Event Name",
  "sport": "running | cycling | triathlon | swimming | other",
  "distance": "42.195 km" | "70.3 miles" | null,
  "eventDate": "2025-09-28" | null,
  "location": "City, Country" | null,
  "confidence": "high" | "medium" | "low"
}

If you're not confident this is a real event, return:
{ "found": false }`;

        const text = await callAI(SYSTEM_PROMPT, lookupPrompt, 512);
        const parsed = safeJsonParse(text);

        if (parsed && parsed.found === true && parsed.confidence !== "low") {
          return res.json({ ok: true, data: parsed });
        }
        return res.json({ ok: true, data: { found: false } });
      }

      // ==================== BUILD_TRAINING_CONTEXT ====================
      case "BUILD_TRAINING_CONTEXT": {
        const {
          goal_type,
          sport,
          target_type,
          target_details,
          starting_point,
          plan_weeks,
          event_name,
          weeks_until_event,
        } = payload || {};

        const contextPrompt = `Based on this user profile, determine training context. Return ONLY JSON.

User profile:
- Goal type: ${goal_type || "fitness"}
- Sport: ${sport || "general"}
- Target type: ${target_type || "none"}
- Target details: ${target_details || "none"}
- Starting point: ${starting_point || "on_off"}
- Plan weeks: ${plan_weeks || "8"}
- Event: ${event_name || "none"}
- Weeks until event: ${weeks_until_event || "none"}

Determine:
1. progression_style: How aggressive should weekly increases be?
   - "conservative" = slow, safe, for beginners or returning
   - "moderate" = standard progression
   - "aggressive" = faster progression for experienced athletes

2. weekly_ramp: How much volume increase per week?
   - "slow" = 5-10% increase
   - "normal" = 10-15% increase
   - "fast" = 15-20% increase

3. recovery_priority: How much rest emphasis?
   - "high" = extra rest days, deload weeks
   - "medium" = standard rest
   - "low" = minimal rest (experienced only)

4. assumptions: List any assumptions made about the user

Format:
{
  "progression_style": "conservative | moderate | aggressive",
  "weekly_ramp": "slow | normal | fast",
  "recovery_priority": "high | medium | low",
  "assumptions": ["assumption 1", "assumption 2"]
}`;

        const text = await callAI(SYSTEM_PROMPT, contextPrompt, 512);
        const parsed = safeJsonParse(text);
        return res.json({ ok: true, data: parsed || FALLBACKS.trainingContext });
      }

      // ==================== GENERATE_PLAN ====================
      case "GENERATE_PLAN": {
        const {
          goal_type,
          sport,
          target_type,
          target_details,
          starting_point,
          plan_weeks,
          adaptive,
          event_name,
          weeks_until_event,
          days_per_week,
          // Advanced (optional)
          ftp,
          pace,
          max_lifts,
        } = payload || {};

        // Determine weeks and mode
        let weeks = plan_weeks || 8;
        let planMode = "fixed"; // fixed = clear end goal, adaptive = rolling

        if (adaptive === true || plan_weeks === null) {
          // Adaptive mode: 4-week rolling plan, low aggression, focus on consistency
          weeks = 4;
          planMode = "adaptive";
        } else if (weeks_until_event && weeks_until_event > 0) {
          weeks = Math.min(weeks_until_event, 16);
        }

        // Determine optimization focus
        let optimization = "consistency"; // default
        if (target_type && target_details) {
          optimization = `${target_type}: ${target_details}`;
        } else if (event_name) {
          optimization = `event: ${event_name}`;
        }

        const prompt = `Create a training program. Return ONLY JSON.

User profile:
- Goal type: ${goal_type || "fitness"}
- Sport: ${sport || "general"}
- Target: ${target_type ? `${target_type} - ${target_details || "general"}` : "none (optimize for consistency)"}
- Starting point: ${starting_point || "on_off"}
- Event: ${event_name || "none"}
- Weeks until event: ${weeks_until_event || "none"}
- Days per week: ${days_per_week || 3}
- Plan mode: ${planMode}
${ftp ? `- FTP: ${ftp}` : ""}
${pace ? `- Pace: ${pace}` : ""}
${max_lifts ? `- Max lifts: ${max_lifts}` : ""}

OPTIMIZATION RULE:
${target_type ? `This plan OPTIMIZES toward: ${optimization}` : "No specific target → OPTIMIZE for CONSISTENCY and habit-building"}

Starting point meanings:
- "regular" = training 3+ times/week consistently
- "on_off" = inconsistent, sometimes trains
- "returning" = just getting back after break
- "not_training" = hasn't trained in months

Plan mode meanings:
- "fixed" = ${weeks} weeks with clear progression toward goal
- "adaptive" = 4-week rolling plan, low intensity, prioritize recovery and consistency

Rules:
- Consistency over intensity
- Include rest days
- Realistic for everyday life
- Max ${days_per_week || 3} training days per week
- ${weeks} weeks total
- If starting_point is "not_training" or "returning": start very easy
- If target_type is "strength": focus on compound lifts
- If target_type is "endurance": focus on aerobic base
- If target_type is "consistency": focus on habit building
- If plan_mode is "adaptive": keep intensity LOW, prioritize recovery, no aggressive progression

Format:
{
  "plan": {
    "weeks": ${weeks},
    "days_per_week": ${days_per_week || 3},
    "mode": "${planMode}",
    "schedule": [
      {
        "week": 1,
        "focus": "week focus description",
        "days": [
          { "day": "Monday", "type": "training", "description": "short description" },
          { "day": "Tuesday", "type": "rest", "description": "rest or light activity" },
          { "day": "Wednesday", "type": "training", "description": "short description" },
          { "day": "Thursday", "type": "rest", "description": "rest" },
          { "day": "Friday", "type": "training", "description": "short description" },
          { "day": "Saturday", "type": "rest", "description": "rest" },
          { "day": "Sunday", "type": "rest", "description": "rest or light activity" }
        ]
      }
    ]
  },
  "explanation": "3-5 sentences explaining the plan philosophy and progression"
}

Only include week 1 in the schedule (the pattern repeats with progression).`;

        const text = await callAI(SYSTEM_PROMPT, prompt, 2048);
        const parsed = safeJsonParse(text);
        return res.json({ ok: true, data: parsed || FALLBACKS.generatePlan });
      }

      // ==================== SUMMARY ====================
      case "SUMMARY": {
        const {
          plan,
          goal_type,
          sport,
          target_type,
          target_details,
          event_name,
          plan_weeks,
          starting_point,
        } = payload || {};

        const summaryPrompt = `Explain this training plan calmly and clearly to the user.

Context:
- Goal: ${goal_type || "general training"}
- Sport: ${sport || "general"}
- Target: ${target_type || "none"} ${target_details ? `(${target_details})` : ""}
- Event: ${event_name || "none"}
- Duration: ${plan_weeks || plan?.plan?.weeks || 8} weeks
- Starting point: ${starting_point || "on_off"}
- Days per week: ${plan?.plan?.days_per_week || 3}

Write 3-4 sentences that explain:
1. What the plan prioritizes
2. Why it's realistic given their starting point
3. What's intentionally kept light

ALWAYS start with this exact line (builds trust):
"This plan is built around your goal, starting point, and the time you chose."

Then add your explanation.

ALWAYS end with this exact question:
"Does this feel realistic for you?"

No hype. No technical jargon. Calm tone.`;

        const text = await callAI(SYSTEM_PROMPT, summaryPrompt, 512);
        const summary = text || "The plan focuses on building a sustainable routine. Does this feel realistic for you?";
        return res.json({ ok: true, data: { summary } });
      }

      // ==================== ADJUST_PLAN ====================
      case "ADJUST_PLAN": {
        const { currentPlan, adjustmentRequest } = payload || {};

        const adjustPrompt = `The user wants to adjust their training plan.

Current plan summary:
${JSON.stringify(currentPlan?.plan || currentPlan, null, 2)}

User's request:
"${adjustmentRequest}"

Make the requested adjustment and return the updated plan in the same JSON format.
Keep the same structure, just modify based on user feedback.

If the request is unclear, make a reasonable interpretation.`;

        const text = await callAI(SYSTEM_PROMPT, adjustPrompt, 2048);
        const parsed = safeJsonParse(text);
        return res.json({ ok: true, data: parsed || currentPlan });
      }

      // ==================== CONFIRM ====================
      case "CONFIRM": {
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
