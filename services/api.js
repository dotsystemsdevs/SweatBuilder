// API Service for backend communication
const API_URL = "https://sweatbuilder-production.up.railway.app";

export async function callOnboardingAPI(step, payload = {}) {
  try {
    const response = await fetch(`${API_URL}/api/ai/onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ step, payload }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[API Error]", error.message);
    return { ok: false, error: error.message };
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

// Health check
export const ping = () => callOnboardingAPI("PING");

// Interpret user's goal text
export const interpretGoal = (goalText) =>
  callOnboardingAPI("INTERPRET_GOAL", { goalText });

// Look up event by name
export const lookupEvent = (eventName) =>
  callOnboardingAPI("LOOKUP_EVENT", { eventName });

// Build training context (determines progression style, ramp, recovery)
export const buildTrainingContext = (data) =>
  callOnboardingAPI("BUILD_TRAINING_CONTEXT", data);

// Generate training plan
export const generatePlan = (data) =>
  callOnboardingAPI("GENERATE_PLAN", data);

// Get plan summary
export const getSummary = (data) =>
  callOnboardingAPI("SUMMARY", data);

// Adjust existing plan
export const adjustPlan = (currentPlan, adjustmentRequest) =>
  callOnboardingAPI("ADJUST_PLAN", { currentPlan, adjustmentRequest });

// Confirm plan
export const confirmPlan = () =>
  callOnboardingAPI("CONFIRM");

// Chat with AI
export const chat = (message, context = null) =>
  callOnboardingAPI("CHAT", { message, context });
