/**
 * Dummy AI responses for development/testing
 * Replace with real AI integration when ready
 */

export const DUMMY_RESPONSES = {
  "bench press":
    "Focus on proper form: keep your shoulder blades pinched, feet flat on the floor, and lower the bar to mid-chest. Try adding pause reps to build strength off the chest.",
  recovery:
    "After leg day, prioritize sleep, hydration, and protein intake. Light stretching, foam rolling, and a 10-15 min walk can help reduce soreness.",
  skip:
    "Listen to your body. If you're truly exhausted or sick, rest is better than a poor workout. If it's just motivation, try a lighter session - something is better than nothing.",
  "warm-up":
    "Start with 5 min light cardio, then dynamic stretches. Do activation exercises for the muscles you'll train, and warm-up sets before working sets.",
  injuries:
    "Gradually increase mileage (max 10% per week), invest in good shoes, strengthen your hips and core, and don't skip rest days.",
  weight:
    "Increase weight when you can complete all sets with good form. Usually after 2-3 successful sessions at the same weight.",
  default:
    "Great question! Here's what I'd suggest: Focus on consistency, proper form, and progressive overload. Track your workouts and adjust based on how you feel.",
};

/**
 * Get a dummy response based on user message keywords
 */
export const getDummyResponse = (userMessage) => {
  const lower = userMessage.toLowerCase();
  if (lower.includes("bench")) return DUMMY_RESPONSES["bench press"];
  if (lower.includes("recovery") || lower.includes("leg day")) return DUMMY_RESPONSES.recovery;
  if (lower.includes("skip")) return DUMMY_RESPONSES.skip;
  if (lower.includes("warm")) return DUMMY_RESPONSES["warm-up"];
  if (lower.includes("injur") || lower.includes("running")) return DUMMY_RESPONSES.injuries;
  if (lower.includes("weight") || lower.includes("increase")) return DUMMY_RESPONSES.weight;
  return DUMMY_RESPONSES.default;
};
