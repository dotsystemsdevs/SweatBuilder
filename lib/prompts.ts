export interface GoalPayload {
  userMessage: string;
  conversationHistory?: string[];
}

export interface PlanPayload {
  goal: string;
  experience: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  equipment: string[];
  sessionMinutes?: number;
}

export interface SummaryPayload {
  plan: {
    weeks: number;
    daysPerWeek: number;
    exercises: { name: string; sets: number; reps: string }[];
  };
}

export function interpretGoalPrompt(payload: GoalPayload): string {
  return `Analyze the user's training goal from their message.

User message: "${payload.userMessage}"

${payload.conversationHistory?.length ? `Previous context:\n${payload.conversationHistory.join("\n")}` : ""}

Respond with JSON only:
{
  "goal": "string - the interpreted goal (build muscle, lose weight, improve endurance, general fitness, etc)",
  "confidence": "high | medium | low",
  "clarifyingQuestion": "string | null - ask if confidence is low"
}`;
}

export function generatePlanPrompt(payload: PlanPayload): string {
  return `Create a training program.

Input:
- Goal: ${payload.goal}
- Experience: ${payload.experience}
- Days per week: ${payload.daysPerWeek}
- Equipment: ${payload.equipment.length ? payload.equipment.join(", ") : "bodyweight only"}
- Session length: ${payload.sessionMinutes ?? 45} minutes

Rules:
- Prefer compound movements
- Progressive overload built in
- Rest days between same muscle groups
- Keep it simple

Respond with JSON only:
{
  "programName": "string",
  "weeks": number,
  "schedule": [
    {
      "day": 1,
      "focus": "string",
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": "string",
          "notes": "string | null"
        }
      ]
    }
  ],
  "progressionNotes": "string"
}`;
}

export function summarizePlanPrompt(payload: SummaryPayload): string {
  return `Summarize this training plan in 2-3 sentences.

Plan:
- Duration: ${payload.plan.weeks} weeks
- Frequency: ${payload.plan.daysPerWeek} days/week
- Total exercises: ${payload.plan.exercises.length}
- Exercises: ${payload.plan.exercises.map((e) => e.name).join(", ")}

Respond with JSON only:
{
  "summary": "string - brief description of the plan",
  "keyPoints": ["string", "string", "string"]
}`;
}
