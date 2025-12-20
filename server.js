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

// Enhanced system prompt for new onboarding v2
const SYSTEM_PROMPT_V2 = `You are an expert training coach and program designer. Calm, supportive, never judgmental.

HARD PRINCIPLES (NEVER BREAK THESE):
1. Onboarding = the entire plan. All workouts must be fully defined.
2. AI coach can ONLY adapt within defined limits - never invent new structure.
3. Constraints are unbreakable rules.
4. When unclear, choose SAFE + SUSTAINABLE.
5. The system must work for: chaotic lives, low energy, stress, missed workouts.

INTENT SYSTEM (why user trains):
- FUNKTION = functional movement/capability
- KANSLA = feel good/mood
- LIVSSTIL = lifestyle/habit
- PRESTATION = performance/results
- EXPERIMENT = trying something new

Primary intent can NEVER be sacrificed for secondary.

TONE:
- Never judgmental
- Never extreme
- Never pushy
- Safe, everyday, professional

You ONLY respond with valid JSON.`;

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

      // ==================== INTERPRET_GOAL_V2 ====================
      // Enhanced goal interpretation with level, intent, direction, risk
      case "INTERPRET_GOAL_V2": {
        const { goalText } = payload || {};
        if (!goalText) {
          return res.json({
            ok: true,
            data: {
              type: "NON_EVENT",
              level: 1,
              intent: "LIVSSTIL",
              direction: "",
              displayTitle: "",
              risk: [],
              confidence: "low",
            },
          });
        }

        const prompt = `Interpret this goal and NORMALIZE messy input into clean format. Return ONLY JSON.

Goal: "${goalText}"

NORMALIZATION RULES (CRITICAL):
1. Remove filler: "hmmmm", "i think", "maybe", "i guess", "uhh", "???" → Remove
2. Time format: "under 4 hours" / "under 4h" / "below 4h" → "Sub-4h"
3. Weight format: "100 kg" / "100 kilos" → "100kg"
4. Distance format: "5 km" / "5 kilometers" → "5K"
5. Title Case for displayTitle

NORMALIZATION EXAMPLES:
- "hmmmm i think i want to run a marathon under 4h ??" → displayTitle: "Sub-4h Marathon"
- "maybe bench press like 100 kg or something" → displayTitle: "Bench Press 100kg"
- "i want to do a half marathon in under 2 hours" → displayTitle: "Half Marathon Sub-2h"
- "get stronger i guess??" → displayTitle: "Build Strength"
- "stockholm marathon" → displayTitle: "Stockholm Marathon"
- "lose weight like 10 kilos" → displayTitle: "Lose 10kg"

FIELDS:
- type: "EVENT" (race/competition/deadline) or "NON_EVENT" (general goal)
- level: 1-5 (1=beginner target, 5=elite target)
- intent: FUNKTION | KANSLA | LIVSSTIL | PRESTATION | EXPERIMENT
- direction: What they want (brief phrase)
- displayTitle: CLEAN 2-6 word title (NO filler words, normalized format)
- risk: Array of concerns or []
- confidence: "high" | "medium" | "low"
- needsEventDetails: true if EVENT needs date/details
- needsMoreInfo: true ONLY if goal is too vague (e.g., "get fit", "run")
- missingInfo: Short question if needsMoreInfo=true, else null

IMPORTANT: Messy informal input does NOT mean needsMoreInfo=true.
If goal is CLEAR despite filler words, normalize it and set needsMoreInfo=false.
Only set needsMoreInfo=true for genuinely vague goals like "get fit" or single words.

Return JSON:
{
  "type": "EVENT" | "NON_EVENT",
  "level": 1-5,
  "intent": "...",
  "direction": "...",
  "displayTitle": "Clean Normalized Title",
  "risk": [],
  "confidence": "high" | "medium" | "low",
  "needsEventDetails": true | false,
  "needsMoreInfo": true | false,
  "missingInfo": "Short question" | null
}`;

        const text = await callAI(SYSTEM_PROMPT_V2, prompt, 512);
        const parsed = safeJsonParse(text);
        return res.json({
          ok: true,
          data: parsed || {
            type: "NON_EVENT",
            level: 2,
            intent: "LIVSSTIL",
            direction: goalText,
            displayTitle: goalText,
            risk: [],
            confidence: "low",
            needsEventDetails: false,
            needsMoreInfo: goalText.length < 5,
            missingInfo: goalText.length < 5 ? "What specifically do you want to achieve?" : null,
          },
        });
      }

      // ==================== ANALYZE_EVENT ====================
      // Detailed event analysis with realism check
      case "ANALYZE_EVENT": {
        const { eventName, eventType, eventDate, currentState } = payload || {};

        const prompt = `Analyze this training event and check if it's realistic.

Event:
- Name: ${eventName || "unknown"}
- Type: ${eventType || "unknown"}
- Date: ${eventDate || "unknown"}

User's current state:
- Sessions per week: ${currentState?.sessionsPerWeek || "unknown"}
- Session duration: ${currentState?.timePerSession || "unknown"} minutes
- Training background: ${currentState?.trainingBackground || "unknown"}
- Injuries/limitations: ${currentState?.injuries || "none mentioned"}

ANALYSIS RULES:
1. Calculate days until event
2. Assess if user has enough time to prepare
3. If not realistic, suggest adjustments (more time, lower goal, etc.)
4. Never say "impossible" - always offer alternatives

Return ONLY JSON:
{
  "eventAnalysis": {
    "name": "official event name or user's input",
    "type": "marathon | half-marathon | triathlon | cycling | swimming | other",
    "date": "YYYY-MM-DD or null",
    "daysUntil": number or null,
    "distance": "distance string or null",
    "location": "location or null"
  },
  "realismCheck": {
    "isRealistic": true | false,
    "reason": "explanation",
    "suggestedAdjustment": "if not realistic, what to suggest",
    "minimumWeeksNeeded": number
  },
  "recommendedStrategy": "BASE_BUILD_PEAK_TAPER phases description"
}`;

        const text = await callAI(SYSTEM_PROMPT_V2, prompt, 1024);
        const parsed = safeJsonParse(text);
        return res.json({
          ok: true,
          data: parsed || {
            eventAnalysis: { name: eventName },
            realismCheck: { isRealistic: true, reason: "Unable to analyze" },
            recommendedStrategy: "Standard periodization",
          },
        });
      }

      // ==================== PROFILE_BEHAVIOR ====================
      // Analyze behavior patterns from user responses
      case "PROFILE_BEHAVIOR": {
        const {
          irregularSchedule,
          energyLevels,
          perfectionism,
          stressLevel,
          preferredMode,
        } = payload || {};

        // This is primarily a pass-through with some interpretation
        const profile = {
          irregularSchedule: irregularSchedule === true || irregularSchedule === "yes",
          energyNotMotivation: energyLevels === "varies" || energyLevels === "low",
          perfectionism: perfectionism === true || perfectionism === "yes",
          stressLevel: stressLevel || "MEDIUM",
          preferredMode: preferredMode || "JUST_TELL_ME",
        };

        // Generate coaching notes based on profile
        const prompt = `Based on this behavior profile, generate brief coaching adaptations.

Profile:
- Irregular schedule: ${profile.irregularSchedule}
- Energy varies (≠ motivation): ${profile.energyNotMotivation}
- Perfectionist tendencies: ${profile.perfectionism}
- Stress level: ${profile.stressLevel}
- Preferred mode: ${profile.preferredMode}

Return ONLY JSON:
{
  "adaptations": ["adaptation1", "adaptation2", "adaptation3"],
  "coachingTone": "description of how to communicate with this user",
  "riskFactors": ["risk1"] or []
}`;

        const text = await callAI(SYSTEM_PROMPT_V2, prompt, 512);
        const parsed = safeJsonParse(text);

        return res.json({
          ok: true,
          data: {
            profile,
            ...parsed,
          },
        });
      }

      // ==================== INTERPRET_CURRENT_STATE ====================
      // AI interprets user's current state description
      case "INTERPRET_CURRENT_STATE": {
        const { description, goal } = payload || {};

        if (!description) {
          return res.json({
            ok: true,
            data: {
              summary: "No training background provided",
              displaySummary: "No background",
              level: 1,
              frequency: "none",
              experience: "beginner",
              limitations: [],
              insights: [],
            },
          });
        }

        const prompt = `Analyze this person's current training situation. Goal: "${goal?.displayTitle || goal?.direction || goal?.raw || "get fit"}".

Their description: "${description}"

TONE RULES (CRITICAL):
- Be ENCOURAGING and POSITIVE - this is a coach, not a doctor
- NEVER be judgmental or negative about their starting point
- NEVER say "you can barely..." or "you're far from..."
- Everyone starts somewhere - celebrate that they're starting!
- Be warm and supportive, like a friendly coach

SUMMARY RULES:
- Write 1-2 SHORT sentences max
- Be encouraging: "You've got a solid base to build on" or "Great starting point — we can work with this!"
- For beginners: "Starting fresh — that means no bad habits to unlearn! 🙌"
- Don't repeat their exact words back - interpret and add a positive spin
- Example good: "You're starting from scratch — perfect blank slate to build from!"
- Example bad: "You said you can barely run anything which means you have a long way to go"

DISPLAY_SUMMARY RULES:
- 3-6 words ONLY
- Positive/neutral label
- Examples: "Fresh start 🌱", "Solid foundation", "Ready to level up", "Getting back on track"

INSIGHTS RULES:
- Add 1-2 short encouraging insights with emojis
- Example: "• Starting from zero = no bad habits to fix 💪"
- Example: "• Your gym experience will transfer well 🔥"

MISSING INFO:
- Only set needsMoreInfo=true if CRITICAL info is missing
- missingInfo should be a SHORT direct question (max 10 words)
- Example good: "What's the longest you can run today?"

Return ONLY JSON:
{
  "summary": "1-2 sentence encouraging summary",
  "displaySummary": "3-6 word positive label",
  "level": 1-5,
  "frequency": "none" | "occasional" | "1-2x/week" | "3-4x/week" | "5+/week",
  "experience": "beginner" | "some experience" | "intermediate" | "experienced",
  "limitations": [],
  "insights": ["• Encouraging insight with emoji"],
  "needsMoreInfo": true | false,
  "missingInfo": "Short direct question or null"
}`;

        const text = await callAI(SYSTEM_PROMPT_V2, prompt, 512);
        const parsed = safeJsonParse(text);
        return res.json({
          ok: true,
          data: parsed || {
            summary: description,
            displaySummary: description.slice(0, 50),
            level: 2,
            frequency: "occasional",
            experience: "some experience",
            limitations: [],
            insights: [],
          },
        });
      }

      // ==================== CALCULATE_GAP ====================
      // Gap analysis between current state and goal
      case "CALCULATE_GAP": {
        const { goal, currentState, event } = payload || {};

        const prompt = `Calculate the gap between user's current state and their goal.

Goal:
- Type: ${goal?.type || "NON_EVENT"}
- Level: ${goal?.level || 2}
- Intent: ${goal?.intent || "LIVSSTIL"}
- Direction: ${goal?.direction || "general fitness"}

Current state:
- Sessions per week: ${currentState?.sessionsPerWeek || 0}
- Session duration: ${currentState?.timePerSession || 0} minutes
- Training background: ${currentState?.trainingBackground || "none"}
- Injuries: ${currentState?.injuries || "none"}

${event?.name ? `Event: ${event.name} on ${event.date}` : "No specific event"}

Determine:
1. Current fitness level (1-5)
2. Required level for goal (1-5)
3. Time needed to bridge gap
4. Is this realistic?

Return ONLY JSON:
{
  "currentLevel": 1-5,
  "targetLevel": 1-5,
  "gapSize": "small" | "medium" | "large",
  "timeframe": "X weeks",
  "isRealistic": true | false,
  "adjustmentSuggestion": "if not realistic, suggest here"
}`;

        const text = await callAI(SYSTEM_PROMPT_V2, prompt, 512);
        const parsed = safeJsonParse(text);
        return res.json({
          ok: true,
          data: parsed || {
            currentLevel: 2,
            targetLevel: 3,
            gapSize: "medium",
            timeframe: "8 weeks",
            isRealistic: true,
            adjustmentSuggestion: "",
          },
        });
      }

      // ==================== GENERATE_STRATEGY ====================
      // Generate training strategy/periodization
      case "GENERATE_STRATEGY": {
        const { goalType, gap, constraints, event, ambition } = payload || {};

        const isEvent = goalType === "EVENT";

        const prompt = `Generate a training strategy/periodization plan.

Goal type: ${goalType}
${isEvent ? `Event: ${event?.name} in ${event?.daysUntil} days` : "No specific event deadline"}
Ambition level: ${ambition || "BALANCED"}
Gap: ${gap?.gapSize || "medium"} (current: ${gap?.currentLevel}, target: ${gap?.targetLevel})

Constraints:
- Max sessions/week: ${constraints?.sessionsPerWeek || 3}
- Max time/session: ${constraints?.timePerSession || 45} minutes
- Locations: ${constraints?.locations?.join(", ") || "flexible"}
- Equipment: ${constraints?.equipment?.join(", ") || "minimal"}
- Prohibitions: ${constraints?.prohibitions?.join(", ") || "none"}

${isEvent ? `
For EVENT goals, use this periodization:
1. BASE (30-40% of time) - Build aerobic foundation, technique
2. BUILD (30-40% of time) - Increase intensity, sport-specific
3. PEAK (15-20% of time) - Race-specific, high intensity
4. TAPER (10-15% of time) - Reduce volume, maintain intensity
` : `
For NON-EVENT goals, use this periodization:
1. SAFE (2-3 weeks) - Establish routine, low intensity
2. BUILD (4-6 weeks) - Gradual progression
3. MAINTAIN (ongoing) - Sustainable level
4. TEST (optional) - Occasional assessment
`}

Return ONLY JSON:
{
  "strategyType": "${isEvent ? "BASE_BUILD_PEAK_TAPER" : "SAFE_BUILD_MAINTAIN_TEST"}",
  "totalWeeks": number,
  "phases": [
    {
      "name": "phase name",
      "weeks": [1, 2, 3],
      "focus": "what to focus on",
      "intensityRange": [minPercent, maxPercent],
      "sessionsPerWeek": number
    }
  ],
  "deloadWeeks": [week numbers],
  "explanation": "brief explanation of the strategy"
}`;

        const text = await callAI(SYSTEM_PROMPT_V2, prompt, 1024);
        const parsed = safeJsonParse(text);
        return res.json({
          ok: true,
          data: parsed || {
            strategyType: isEvent ? "BASE_BUILD_PEAK_TAPER" : "SAFE_BUILD_MAINTAIN_TEST",
            totalWeeks: 8,
            phases: [{ name: "Build", weeks: [1, 2, 3, 4, 5, 6, 7, 8], focus: "General", intensityRange: [50, 70] }],
            deloadWeeks: [4, 8],
          },
        });
      }

      // ==================== GENERATE_MASTER_PLAN_V2 ====================
      // Full master plan with workout variants
      case "GENERATE_MASTER_PLAN_V2": {
        const {
          goal,
          intent,
          gap,
          event,
          constraints,
          behaviorProfile,
          strategy,
          ambition,
        } = payload || {};

        const prompt = `Generate a COMPLETE master training plan with all workout details.

USER PROFILE:
- Goal: ${goal?.direction || "general fitness"} (${goal?.type || "NON_EVENT"})
- Intent: ${intent?.primary || "LIVSSTIL"}
- Current level: ${gap?.currentLevel || 2}, Target: ${gap?.targetLevel || 3}
- Ambition: ${ambition || "BALANCED"}

${event?.name ? `EVENT: ${event.name} on ${event.date} (${event.daysUntil} days)` : ""}

CONSTRAINTS (UNBREAKABLE):
- Sessions/week: ${constraints?.sessionsPerWeek || 3}
- Time/session: ${constraints?.timePerSession || 45} min
- Locations: ${constraints?.locations?.join(", ") || "any"}
- Equipment: ${constraints?.equipment?.join(", ") || "minimal"}
- Prohibitions: ${constraints?.prohibitions?.join(", ") || "none"}

BEHAVIOR:
- Irregular schedule: ${behaviorProfile?.irregularSchedule || false}
- Energy varies: ${behaviorProfile?.energyNotMotivation || false}
- Perfectionist: ${behaviorProfile?.perfectionism || false}
- Stress: ${behaviorProfile?.stressLevel || "MEDIUM"}

STRATEGY:
${JSON.stringify(strategy, null, 2)}

RULES FOR PLAN GENERATION:
1. Every workout MUST have 3 versions:
   - normal: Full workout as designed
   - light: 60% volume/intensity (for low energy days)
   - short: Core exercises only, 50% time (for time-pressed days)

2. Include environment alternatives where possible

3. For STRENGTH workouts include:
   - Exercise name, sets, reps
   - Weight guidance (RPE or % of max)
   - Rest periods
   - Alternatives for each exercise

4. For CARDIO workouts include:
   - Duration/distance
   - Intensity zone (1-5)
   - Interval structure if applicable

5. Include deload weeks as specified in strategy

Return ONLY JSON:
{
  "masterPlan": {
    "totalWeeks": number,
    "currentWeek": 1,
    "mode": "FIXED" | "ROLLING",
    "strategy": {
      "type": "strategy type",
      "phases": [from strategy]
    }
  },
  "weeklyStructure": {
    "preferredDays": ["monday", "wednesday", "friday"],
    "restDays": ["sunday"],
    "template": [
      { "day": "monday", "workoutType": "strength", "timeSlot": "FLEXIBLE" }
    ]
  },
  "workouts": [
    {
      "id": "week1-day1",
      "weekNumber": 1,
      "dayOfWeek": "monday",
      "type": "STRENGTH",
      "title": "workout title",
      "purpose": "what this workout achieves",
      "duration": 45,
      "versions": {
        "normal": {
          "exercises": [
            { "name": "exercise", "sets": 3, "reps": "8-10", "rest": 90, "notes": "" }
          ],
          "totalDuration": 45
        },
        "light": {
          "exercises": [...],
          "totalDuration": 30
        },
        "short": {
          "exercises": [...],
          "totalDuration": 20
        }
      }
    }
  ],
  "progressionRules": {
    "weeklyVolumeIncrease": 0.05,
    "deloadFrequency": 4,
    "intensityProgression": "LINEAR"
  },
  "allowedAdjustments": {
    "canSwitchVersion": true,
    "canScaleIntensity": { "min": -20, "max": 10 },
    "canSwapExercise": true,
    "canMoveWorkout": true,
    "canEnablePauseMode": true
  }
}

Generate workouts for week 1 only. The pattern repeats with progression.
Focus on QUALITY over quantity. Make each workout purposeful.`;

        const text = await callAI(SYSTEM_PROMPT_V2, prompt, 4096);
        const parsed = safeJsonParse(text);

        if (!parsed) {
          return res.json({
            ok: true,
            data: {
              masterPlan: {
                totalWeeks: strategy?.totalWeeks || 8,
                currentWeek: 1,
                mode: "FIXED",
                strategy: strategy || { type: "SAFE_BUILD_MAINTAIN_TEST", phases: [] },
              },
              weeklyStructure: {
                preferredDays: ["monday", "wednesday", "friday"],
                restDays: ["sunday"],
              },
              workouts: [],
              progressionRules: {
                weeklyVolumeIncrease: 0.05,
                deloadFrequency: 4,
              },
              allowedAdjustments: {
                canSwitchVersion: true,
                canScaleIntensity: { min: -20, max: 10 },
                canSwapExercise: true,
                canMoveWorkout: true,
                canEnablePauseMode: true,
              },
            },
          });
        }

        return res.json({ ok: true, data: parsed });
      }

      // ==================== SUMMARIZE_PLAN_V2 ====================
      // Generate trust-building summary for new plan
      case "SUMMARIZE_PLAN_V2": {
        const { dataContract } = payload || {};

        const prompt = `Write a calm, trust-building summary of this training plan.

Plan overview:
- Goal: ${dataContract?.goal?.direction || "general fitness"}
- Type: ${dataContract?.goal?.type || "NON_EVENT"}
- Intent: ${dataContract?.intent?.primary || "LIVSSTIL"}
- Duration: ${dataContract?.masterPlan?.totalWeeks || 8} weeks
- Sessions/week: ${dataContract?.constraints?.sessionsPerWeek || 3}
- Current level: ${dataContract?.gap?.currentLevel || 2}

${dataContract?.event?.name ? `Event: ${dataContract.event.name}` : ""}

WRITE A SUMMARY THAT:
1. Starts by acknowledging what the user told you
2. Explains WHY this plan is designed this way
3. Mentions the safety nets (light/short versions)
4. Ends by asking if this feels realistic

TONE: Calm, professional, no hype, no exclamation marks.

Return ONLY JSON:
{
  "summary": "the summary text (3-5 sentences)",
  "keyPoints": ["point1", "point2", "point3"],
  "safetyNets": ["you can switch to light version", "short version for busy days", "pause mode available"]
}`;

        const text = await callAI(SYSTEM_PROMPT_V2, prompt, 1024);
        const parsed = safeJsonParse(text);
        return res.json({
          ok: true,
          data: parsed || {
            summary: "This plan is built around your goal and current situation. Does this feel realistic for you?",
            keyPoints: [],
            safetyNets: ["Light version available", "Short version for busy days"],
          },
        });
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
