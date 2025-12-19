/**
 * Mock chat data for development/testing
 * Separated from store for better organization
 */

import { generateId } from "../utils/idGenerator";

// Set to true to always show dummy data (for design testing)
export const FORCE_DUMMY_DATA = true;

/**
 * Generate initial chat data with realistic timestamps
 */
export const getInitialChats = () => {
  if (!FORCE_DUMMY_DATA) return [];

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneHour = 60 * 60 * 1000;

  return [
    {
      id: "dummy-1",
      title: "Help me finish strong today",
      messages: [
        {
          id: generateId(),
          text: "Help me finish strong today",
          isAI: false,
          timestamp: "14:30",
        },
        {
          id: generateId(),
          text: "Based on your plan, today is a push day. You've got bench press, shoulder press, and triceps left. Focus on controlled reps and good form – you're almost there! 💪",
          isAI: true,
          timestamp: "14:30",
        },
      ],
      createdAt: new Date(now - 2 * oneHour).toISOString(),
      updatedAt: new Date(now - 2 * oneHour).toISOString(),
    },
    {
      id: "dummy-2",
      title: "Should I skip leg day? Feeling tired",
      messages: [
        {
          id: generateId(),
          text: "Should I skip leg day? Feeling tired",
          isAI: false,
          timestamp: "09:15",
        },
        {
          id: generateId(),
          text: "I see you trained hard yesterday. If you're just mentally tired, try a lighter warm-up first – often energy comes once you start. But if it's physical exhaustion, a rest day might help you perform better tomorrow.",
          isAI: true,
          timestamp: "09:15",
        },
      ],
      createdAt: new Date(now - 1 * oneDay).toISOString(),
      updatedAt: new Date(now - 1 * oneDay).toISOString(),
    },
    {
      id: "dummy-3",
      title: "Best exercises for back width",
      messages: [
        {
          id: generateId(),
          text: "Best exercises for back width",
          isAI: false,
          timestamp: "18:45",
        },
        {
          id: generateId(),
          text: "For wider lats, focus on: 1) Wide-grip pull-ups, 2) Lat pulldowns with a wide grip, 3) Seated cable rows, and 4) Single-arm dumbbell rows. Aim for 3-4 sets of 8-12 reps with proper mind-muscle connection.",
          isAI: true,
          timestamp: "18:45",
        },
      ],
      createdAt: new Date(now - 3 * oneDay).toISOString(),
      updatedAt: new Date(now - 3 * oneDay).toISOString(),
    },
    {
      id: "dummy-4",
      title: "How much protein do I really need?",
      messages: [
        {
          id: generateId(),
          text: "How much protein do I really need?",
          isAI: false,
          timestamp: "12:00",
        },
        {
          id: generateId(),
          text: "For muscle building, aim for 1.6-2.2g per kg bodyweight daily. At your weight, that's roughly 130-175g. Spread it across 4-5 meals for optimal absorption. Protein shakes can help if you struggle to hit your target.",
          isAI: true,
          timestamp: "12:00",
        },
      ],
      createdAt: new Date(now - 5 * oneDay).toISOString(),
      updatedAt: new Date(now - 5 * oneDay).toISOString(),
    },
    {
      id: "dummy-5",
      title: "Can I train with sore muscles?",
      messages: [
        {
          id: generateId(),
          text: "Can I train with sore muscles?",
          isAI: false,
          timestamp: "16:20",
        },
        {
          id: generateId(),
          text: "Light soreness (DOMS) is fine to train through – just warm up well. If it's severe or joint pain, rest that area. You can train other muscle groups instead.",
          isAI: true,
          timestamp: "16:20",
        },
      ],
      createdAt: new Date(now - 7 * oneDay).toISOString(),
      updatedAt: new Date(now - 7 * oneDay).toISOString(),
    },
    {
      id: "dummy-6",
      title: "Best time to work out?",
      messages: [
        {
          id: generateId(),
          text: "Best time to work out?",
          isAI: false,
          timestamp: "08:00",
        },
        {
          id: generateId(),
          text: "The best time is when you can be consistent! Research shows slight strength peaks in late afternoon, but the difference is small. Pick a time that fits your schedule.",
          isAI: true,
          timestamp: "08:00",
        },
      ],
      createdAt: new Date(now - 10 * oneDay).toISOString(),
      updatedAt: new Date(now - 10 * oneDay).toISOString(),
    },
  ];
};
