import type { VercelRequest, VercelResponse } from "@vercel/node";
import anthropic from "../../lib/aiClient";
import { SYSTEM_PROMPT } from "../../lib/systemPrompt";
import {
  interpretGoalPrompt,
  generatePlanPrompt,
  summarizePlanPrompt,
  GoalPayload,
  PlanPayload,
  SummaryPayload,
} from "../../lib/prompts";

type Step = "PING" | "INTERPRET_GOAL" | "GENERATE_PLAN" | "SUMMARIZE_PLAN";

interface RequestBody {
  step: Step;
  payload?: unknown;
}

// Fallback responses when AI fails
const FALLBACKS = {
  interpretGoal: {
    goal: "general_fitness",
    confidence: "low" as const,
    clarifyingQuestion: "Kan du berätta lite mer om vad du vill uppnå med din träning?",
  },
  generatePlan: {
    programName: "Grundprogram",
    weeks: 4,
    schedule: [],
    progressionNotes: "Kunde inte generera program just nu. Försök igen.",
  },
  summarizePlan: {
    summary: "Ett balanserat träningsprogram.",
    keyPoints: ["Regelbunden träning", "Progressiv ökning", "Tillräcklig vila"],
  },
};

function safeJsonParse<T>(text: string): { success: true; data: T } | { success: false } {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false };
    }
    const data = JSON.parse(jsonMatch[0]) as T;
    return { success: true, data };
  } catch {
    return { success: false };
  }
}

async function callAI(prompt: string): Promise<string | null> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.text ?? null;
  } catch (error) {
    console.error("[AI Call Error]", error instanceof Error ? error.message : "Unknown");
    return null;
  }
}

async function handleInterpretGoal(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("userMessage" in payload)) {
    return { data: FALLBACKS.interpretGoal };
  }

  try {
    const prompt = interpretGoalPrompt(payload as GoalPayload);
    const text = await callAI(prompt);

    if (!text) {
      console.error("[InterpretGoal] AI returned no response");
      return { data: FALLBACKS.interpretGoal };
    }

    const parsed = safeJsonParse<{
      goal: string;
      confidence: string;
      clarifyingQuestion: string | null;
    }>(text);

    if (!parsed.success) {
      console.error("[InterpretGoal] Failed to parse AI response");
      return { data: FALLBACKS.interpretGoal };
    }

    return { data: parsed.data };
  } catch (error) {
    console.error("[InterpretGoal Error]", error instanceof Error ? error.message : "Unknown");
    return { data: FALLBACKS.interpretGoal };
  }
}

async function handleGeneratePlan(payload: unknown) {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("goal" in payload) ||
    !("experience" in payload) ||
    !("daysPerWeek" in payload)
  ) {
    return { data: FALLBACKS.generatePlan };
  }

  try {
    const p = payload as PlanPayload;
    const safePayload: PlanPayload = {
      goal: p.goal,
      experience: p.experience,
      daysPerWeek: p.daysPerWeek,
      equipment: p.equipment ?? [],
      sessionMinutes: p.sessionMinutes,
    };

    const prompt = generatePlanPrompt(safePayload);
    const text = await callAI(prompt);

    if (!text) {
      console.error("[GeneratePlan] AI returned no response");
      return { data: FALLBACKS.generatePlan };
    }

    const parsed = safeJsonParse<{
      programName: string;
      weeks: number;
      schedule: unknown[];
      progressionNotes: string;
    }>(text);

    if (!parsed.success) {
      console.error("[GeneratePlan] Failed to parse AI response");
      return { data: FALLBACKS.generatePlan };
    }

    return { data: parsed.data };
  } catch (error) {
    console.error("[GeneratePlan Error]", error instanceof Error ? error.message : "Unknown");
    return { data: FALLBACKS.generatePlan };
  }
}

async function handleSummarizePlan(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("plan" in payload)) {
    return { data: FALLBACKS.summarizePlan };
  }

  try {
    const prompt = summarizePlanPrompt(payload as SummaryPayload);
    const text = await callAI(prompt);

    if (!text) {
      console.error("[SummarizePlan] AI returned no response");
      return { data: FALLBACKS.summarizePlan };
    }

    const parsed = safeJsonParse<{
      summary: string;
      keyPoints: string[];
    }>(text);

    if (!parsed.success) {
      console.error("[SummarizePlan] Failed to parse AI response");
      return { data: FALLBACKS.summarizePlan };
    }

    return { data: parsed.data };
  } catch (error) {
    console.error("[SummarizePlan Error]", error instanceof Error ? error.message : "Unknown");
    return { data: FALLBACKS.summarizePlan };
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Always return JSON
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = req.body as RequestBody | null;
    const step = body?.step;

    if (!step) {
      return res.status(400).json({ ok: false, error: "step is required" });
    }

    switch (step) {
      case "PING":
        // Test mode - no AI call, just connectivity check
        return res.status(200).json({ ok: true });

      case "INTERPRET_GOAL": {
        const result = await handleInterpretGoal(body?.payload);
        return res.status(200).json({ ok: true, ...result });
      }

      case "GENERATE_PLAN": {
        const result = await handleGeneratePlan(body?.payload);
        return res.status(200).json({ ok: true, ...result });
      }

      case "SUMMARIZE_PLAN": {
        const result = await handleSummarizePlan(body?.payload);
        return res.status(200).json({ ok: true, ...result });
      }

      default:
        return res.status(400).json({ ok: false, error: "Unknown step" });
    }
  } catch (error) {
    console.error("[Handler Error]", error instanceof Error ? error.message : "Unknown");
    return res.status(500).json({ ok: false, error: "Something went wrong" });
  }
}
