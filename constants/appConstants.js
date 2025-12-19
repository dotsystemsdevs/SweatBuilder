/**
 * Application-wide constants
 */

export const MAX_CHAT_LENGTH = 1000;
export const MAX_CHATS_TOTAL = 5;
export const MAX_PINNED_CHATS = 4;
export const MAX_CHAT_TITLE_LENGTH = 40;
export const MIN_CHAT_TITLE_LENGTH = 20;

export const WORKOUT_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETED: "completed",
  SKIPPED: "skipped",
  REST: "rest",
};

export const SKIP_REASONS = [
  "Tired",
  "Sore",
  "Sick",
  "Busy",
  "Travel",
  "Injury",
  "Weather",
  "No Motivation",
  "Time",
  "Other"
];

export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const EFFORT_LEVELS = [
  { label: "Easy", icon: "happy-outline", value: 1 },
  { label: "Moderate", icon: "remove-outline", value: 2 },
  { label: "Hard", icon: "fitness-outline", value: 3 },
  { label: "Brutal", icon: "flame-outline", value: 4 },
];

export const DEFAULT_CHAT_MESSAGE = "Hey! I'm your AI training coach. Ask me anything about training, recovery, technique, or race planning.";

