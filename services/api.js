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

// Convenience functions for each step
export const ping = () => callOnboardingAPI("PING");

export const interpretGoal = (goalText) =>
  callOnboardingAPI("INTERPRET_GOAL", { goalText });

export const eventFollowup = (missingInfo) =>
  callOnboardingAPI("EVENT_FOLLOWUP", { missingInfo });

export const generatePlan = (data) =>
  callOnboardingAPI("GENERATE_PLAN", data);

export const getSummary = (data) =>
  callOnboardingAPI("SUMMARY", data);

export const confirmPlan = () =>
  callOnboardingAPI("CONFIRM");

export const chat = (message, context = null) =>
  callOnboardingAPI("CHAT", { message, context });

export const lookupEvent = (eventName) =>
  callOnboardingAPI("LOOKUP_EVENT", { eventName });
