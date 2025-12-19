/**
 * Program Generator Service
 *
 * Genererar träningsprogram baserat på användarprofil.
 * Steg 1: Template/logik-baserad
 * Steg 2: Kan bytas mot AI (Claude API)
 */

import { generateNumericId } from '../utils/idGenerator';

// ============ KONSTANTER ============

const WORKOUT_TEMPLATES = {
  running: {
    easy: [
      { title: "Lätt löpning", description: "Lugnt tempo, konversationsfart", durationMultiplier: 1 },
      { title: "Återhämtningsjogg", description: "Ta det extra lugnt idag", durationMultiplier: 0.8 },
    ],
    moderate: [
      { title: "Tempolöpning", description: "Stadigt, kontrollerat tempo", durationMultiplier: 1 },
      { title: "Fartlek", description: "Lek med farten - variera mellan lugnt och snabbt", durationMultiplier: 1.1 },
    ],
    hard: [
      { title: "Intervaller", description: "Hög intensitet med vila mellan", durationMultiplier: 1 },
      { title: "Backintervaller", description: "Springa uppför, jogga ner", durationMultiplier: 0.9 },
    ],
    long: [
      { title: "Långpass", description: "Bygg uthållighet med längre distans", durationMultiplier: 1.5 },
    ],
  },
  cycling: {
    easy: [
      { title: "Lätt cykling", description: "Lugn pedalning, hög kadens", durationMultiplier: 1.2 },
    ],
    moderate: [
      { title: "Uthållighetspass", description: "Stadigt tempo, bygga grund", durationMultiplier: 1.3 },
    ],
    hard: [
      { title: "Intervaller", description: "Hög effekt med vila", durationMultiplier: 1 },
      { title: "Sweetspot", description: "Strax under tröskeln", durationMultiplier: 1.2 },
    ],
    long: [
      { title: "Långpass cykel", description: "Bygg uthållighet", durationMultiplier: 2 },
    ],
  },
  swimming: {
    easy: [
      { title: "Teknikpass", description: "Fokus på teknik och känsla", durationMultiplier: 0.8 },
    ],
    moderate: [
      { title: "Uthållighet", description: "Jämnt tempo, längre intervaller", durationMultiplier: 1 },
    ],
    hard: [
      { title: "Fartpass", description: "Korta intensiva intervaller", durationMultiplier: 0.9 },
    ],
  },
  strength: {
    easy: [
      { title: "Rörlighet & stabilitet", description: "Core och balans", durationMultiplier: 0.8 },
    ],
    moderate: [
      { title: "Styrkepass", description: "Helkropp eller delat", durationMultiplier: 1 },
    ],
    hard: [
      { title: "Tung styrka", description: "Fokus på maxstyrka", durationMultiplier: 1 },
    ],
  },
  yoga: {
    easy: [
      { title: "Yin Yoga", description: "Djupa, långsamma stretchningar", durationMultiplier: 1 },
      { title: "Återhämtning", description: "Mjuk rörlighet", durationMultiplier: 0.8 },
    ],
    moderate: [
      { title: "Vinyasa Flow", description: "Rörlig yoga med styrka", durationMultiplier: 1 },
    ],
  },
};

const STRENGTH_EXERCISES = {
  general: [
    { name: "Knäböj", sets: 3, reps: "10-12" },
    { name: "Marklyft", sets: 3, reps: "8-10" },
    { name: "Utfall", sets: 3, reps: "10/ben" },
    { name: "Plankan", sets: 3, reps: "45 sek" },
    { name: "Armhävningar", sets: 3, reps: "10-15" },
    { name: "Rodd", sets: 3, reps: "10-12" },
  ],
  running: [
    { name: "Knäböj", sets: 3, reps: "12-15" },
    { name: "Utfall", sets: 3, reps: "10/ben" },
    { name: "Step-ups", sets: 3, reps: "10/ben" },
    { name: "Benspark", sets: 3, reps: "15" },
    { name: "Vadpress", sets: 3, reps: "15" },
    { name: "Plankan", sets: 3, reps: "60 sek" },
    { name: "Sidoplankan", sets: 2, reps: "30 sek/sida" },
  ],
  cycling: [
    { name: "Knäböj", sets: 4, reps: "8-10" },
    { name: "Benspark", sets: 3, reps: "12" },
    { name: "Benpress", sets: 3, reps: "10" },
    { name: "Core rotation", sets: 3, reps: "12/sida" },
    { name: "Rygglyft", sets: 3, reps: "12" },
  ],
  knee_friendly: [
    { name: "Glute bridge", sets: 3, reps: "15" },
    { name: "Clamshells", sets: 3, reps: "15/sida" },
    { name: "Benlyft (liggande)", sets: 3, reps: "12/ben" },
    { name: "Vadpress", sets: 3, reps: "15" },
    { name: "Plankan", sets: 3, reps: "45 sek" },
    { name: "Bänkpress", sets: 3, reps: "10" },
  ],
  back_friendly: [
    { name: "Knäböj (lätt)", sets: 3, reps: "12" },
    { name: "Utfall", sets: 3, reps: "10/ben" },
    { name: "Bird-dog", sets: 3, reps: "10/sida" },
    { name: "Dead bug", sets: 3, reps: "10/sida" },
    { name: "Pallof press", sets: 3, reps: "10/sida" },
  ],
};

const PHASE_TEMPLATES = {
  race: [
    { name: "Bas", percentOfProgram: 0.25, focus: "Bygga aerob grund", intensityMix: { easy: 85, moderate: 10, hard: 5 } },
    { name: "Uppbyggnad", percentOfProgram: 0.40, focus: "Öka volym gradvis", intensityMix: { easy: 75, moderate: 15, hard: 10 } },
    { name: "Specifik", percentOfProgram: 0.25, focus: "Loppspecifik träning", intensityMix: { easy: 70, moderate: 15, hard: 15 } },
    { name: "Toppning", percentOfProgram: 0.10, focus: "Vila och skärpa", intensityMix: { easy: 90, moderate: 5, hard: 5 } },
  ],
  general: [
    { name: "Introduktion", percentOfProgram: 0.20, focus: "Börja lugnt", intensityMix: { easy: 90, moderate: 10, hard: 0 } },
    { name: "Uppbyggnad", percentOfProgram: 0.50, focus: "Progressiv ökning", intensityMix: { easy: 75, moderate: 15, hard: 10 } },
    { name: "Underhåll", percentOfProgram: 0.30, focus: "Bibehåll nivå", intensityMix: { easy: 70, moderate: 20, hard: 10 } },
  ],
};

const COACH_MESSAGES = {
  tough: {
    weekStart: [
      "Ny vecka, inga ursäkter! Ge allt!",
      "Du har visat att du klarar det - nu tar vi det ett steg till!",
      "Framgång kräver uppoffringar. Denna vecka blir STARK!",
    ],
    motivation: [
      "Sluta inte när det gör ont - sluta när du är klar!",
      "Du är tuffare än du tror.",
      "Resultaten kommer till de som jobbar för dem.",
    ],
  },
  balanced: {
    weekStart: [
      "Ny vecka framför oss! Kör på! 💪",
      "Bra jobbat förra veckan - nu fortsätter vi!",
      "Denna vecka bygger vi vidare på din grund.",
    ],
    motivation: [
      "Du gör framsteg varje dag!",
      "Kom ihåg: konsistens slår perfektion.",
      "Lyssna på kroppen och gör ditt bästa.",
    ],
  },
  gentle: {
    weekStart: [
      "En ny vecka väntar - ta den i din takt. 🌟",
      "Du bestämmer tempot. Jag finns här för dig.",
      "Välkommen till en ny vecka av träning!",
    ],
    motivation: [
      "Varje steg räknas, oavsett hur litet.",
      "Du gör detta för dig själv - det är det som spelar roll.",
      "Ta hand om dig själv idag.",
    ],
  },
  data: {
    weekStart: [
      "Vecka {week}: Målvolym {volume}min, {sessions} pass planerade.",
      "Analys vecka {week}: Fokus på {focus}.",
      "Data för vecka {week}: Se nedan för detaljer.",
    ],
    motivation: [
      "Statistik visar att du är på rätt spår.",
      "Baserat på din progression ökar vi nu {increase}%.",
      "Din efterlevnad: {compliance}%. Fortsätt så!",
    ],
  },
};

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const WEEKDAY_NAMES = { mon: 'Måndag', tue: 'Tisdag', wed: 'Onsdag', thu: 'Torsdag', fri: 'Fredag', sat: 'Lördag', sun: 'Söndag' };

// ============ HJÄLPFUNKTIONER ============

function calculateWeeksToDate(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const diffTime = target - now;
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.max(4, Math.min(52, diffWeeks)); // Min 4, max 52 veckor
}

function getStartingVolume(currentStatus, frequency) {
  const baseMinutes = {
    'none': 60,
    'sporadic': 90,
    '1-2': 120,
    '3-4': 180,
    '5+': 240,
  };
  return baseMinutes[currentStatus] || 120;
}

function selectExercises(mainSport, injuries) {
  let exercises = STRENGTH_EXERCISES.general;

  // Sport-specifika övningar
  if (mainSport === 'running') {
    exercises = STRENGTH_EXERCISES.running;
  } else if (mainSport === 'cycling') {
    exercises = STRENGTH_EXERCISES.cycling;
  }

  // Anpassa för skador
  if (injuries?.includes('knee')) {
    exercises = STRENGTH_EXERCISES.knee_friendly;
  } else if (injuries?.includes('back')) {
    exercises = STRENGTH_EXERCISES.back_friendly;
  }

  return exercises.slice(0, 6); // Max 6 övningar
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function distributeWorkoutsOnDays(preferredDays, count, sports) {
  const available = preferredDays.length > 0 ? preferredDays : ['mon', 'wed', 'fri', 'sat'];
  const result = [];

  // Fördela pass jämnt över tillgängliga dagar
  for (let i = 0; i < count && i < available.length; i++) {
    result.push({
      day: available[i],
      sport: sports[i % sports.length] || sports[0],
    });
  }

  return result;
}

function getCoachMessage(motivation, type) {
  const style = COACH_MESSAGES[motivation] || COACH_MESSAGES.balanced;
  return getRandomItem(style[type] || style.weekStart);
}

// ============ HUVUDFUNKTIONER ============

/**
 * Generera ett komplett träningsprogram
 */
export async function generateProgram(profile) {
  // Simulera "AI-tid" för bättre UX
  await new Promise(resolve => setTimeout(resolve, 1500));

  const {
    name,
    sports = ['running'],
    sportLevels = {},
    goalType = 'health',
    raceInfo,
    raceDate,
    timeGoal,
    currentStatus = '1-2',
    frequency = 3,
    preferredDays = [],
    preferredTime = 'flexible',
    equipment = [],
    injuries = [],
    motivation = 'balanced',
    externalApps = [],
    appWorkoutTypes = {},
  } = profile;

  // Beräkna programlängd
  let duration = 8; // Default
  if (goalType === 'race' && raceInfo?.date) {
    duration = calculateWeeksToDate(raceInfo.date);
  } else if (raceDate) {
    const dateMap = { "Om ~1 månad": 4, "Om ~2-3 månader": 10, "Om ~6 månader": 20, "Om ett år+": 40 };
    duration = dateMap[raceDate] || 12;
  }

  // Skapa faser
  const phaseTemplate = goalType === 'race' ? PHASE_TEMPLATES.race : PHASE_TEMPLATES.general;
  const phases = phaseTemplate.map((phase, index) => {
    const weeksInPhase = Math.max(1, Math.round(duration * phase.percentOfProgram));
    const startWeek = index === 0 ? 1 : phases[index - 1]?.endWeek + 1 || 1;
    return {
      ...phase,
      startWeek,
      endWeek: startWeek + weeksInPhase - 1,
      weeks: weeksInPhase,
    };
  });

  // Justera så att sista fasen slutar på rätt vecka
  phases[phases.length - 1].endWeek = duration;
  phases[phases.length - 1].weeks = duration - phases[phases.length - 1].startWeek + 1;

  // Beräkna startvolym
  const baseVolume = getStartingVolume(currentStatus, frequency);

  // Filtrera bort sporter som hämtas från externa appar
  const externalSports = Object.values(appWorkoutTypes).flat();
  const activeSports = sports.filter(s => !externalSports.includes(s));

  // Om alla sporter är externa, lägg till styrka som default
  if (activeSports.length === 0) {
    activeSports.push('strength');
  }

  // Generera veckoscheman
  const weeks = [];
  for (let weekNum = 1; weekNum <= duration; weekNum++) {
    const currentPhase = phases.find(p => weekNum >= p.startWeek && weekNum <= p.endWeek);
    const weekPlan = generateWeekPlan({
      weekNumber: weekNum,
      phase: currentPhase,
      totalWeeks: duration,
      baseVolume,
      frequency,
      preferredDays,
      preferredTime,
      sports: activeSports,
      mainSport: sports[0],
      sportLevels,
      goalType,
      injuries,
      equipment,
      motivation,
      name,
      externalSports,
    });
    weeks.push(weekPlan);
  }

  // Bygg program-objekt
  const program = {
    id: generateNumericId(),
    name: raceInfo?.name || getProgramName(goalType, sports[0]),
    goal: goalType,
    goalType,
    raceInfo,
    timeGoal,
    duration,
    startDate: new Date().toISOString(),
    currentWeek: 1,

    userProfile: {
      name,
      sports,
      sportLevels,
      currentStatus,
      equipment,
      injuries,
      motivation,
    },

    schedule: {
      daysPerWeek: frequency,
      preferredDays,
      preferredTime,
    },

    externalSources: appWorkoutTypes,
    phases,
    weeks,

    createdAt: new Date().toISOString(),
    generatedBy: 'template', // Ändras till 'ai' när vi integrerar Claude
  };

  return program;
}

function getProgramName(goalType, mainSport) {
  const names = {
    race: 'Lopp-program',
    improve: 'Förbättringsprogram',
    health: 'Hälsoprogram',
    weight: 'Viktprogram',
    strength: 'Styrkeprogram',
    habit: 'Träningsvana',
  };
  return names[goalType] || 'Mitt träningsprogram';
}

/**
 * Generera ett veckoschema
 */
function generateWeekPlan(options) {
  const {
    weekNumber,
    phase,
    totalWeeks,
    baseVolume,
    frequency,
    preferredDays,
    preferredTime,
    sports,
    mainSport,
    sportLevels,
    goalType,
    injuries,
    equipment,
    motivation,
    name,
    externalSports,
  } = options;

  // Beräkna veckans volym (progressiv ökning med lätta veckor)
  const isRecoveryWeek = weekNumber % 4 === 0;
  const progressionFactor = 1 + (weekNumber / totalWeeks) * 0.5; // Öka med upp till 50%
  let weekVolume = Math.round(baseVolume * progressionFactor);
  if (isRecoveryWeek) {
    weekVolume = Math.round(weekVolume * 0.7); // 30% reduktion på vila-veckor
  }

  // Bestäm intensitetsmix
  const intensityMix = phase?.intensityMix || { easy: 80, moderate: 15, hard: 5 };

  // Fördela pass på dagar
  const workoutSlots = distributeWorkoutsOnDays(preferredDays, frequency, sports);

  // Generera pass
  const workouts = workoutSlots.map((slot, index) => {
    // Bestäm intensitet för passet
    let intensity = 'easy';
    const rand = Math.random() * 100;
    if (rand < intensityMix.hard && index > 0) {
      intensity = 'hard';
    } else if (rand < intensityMix.hard + intensityMix.moderate) {
      intensity = 'moderate';
    }

    // Långpass på helgen (om det är en helgdag)
    const isWeekend = ['sat', 'sun'].includes(slot.day);
    if (isWeekend && slot.sport === 'running' && frequency >= 3) {
      intensity = 'long';
    }

    // Generera passet
    return generateWorkout({
      id: `w${weekNumber}-${index + 1}`,
      day: slot.day,
      sport: slot.sport,
      intensity,
      weekVolume,
      frequency,
      preferredTime,
      sportLevels,
      injuries,
      equipment,
      motivation,
      isRecoveryWeek,
    });
  });

  // Coach-meddelande
  let coachNote = getCoachMessage(motivation, 'weekStart');
  coachNote = coachNote
    .replace('{week}', weekNumber)
    .replace('{volume}', weekVolume)
    .replace('{sessions}', frequency)
    .replace('{focus}', phase?.focus || 'träning')
    .replace('{name}', name);

  if (isRecoveryWeek) {
    coachNote += motivation === 'tough'
      ? ' Vilovecka - men slappa inte för mycket!'
      : ' Vila-vecka denna vecka. Ladda batterierna!';
  }

  // Externa pass notis
  if (externalSports.length > 0) {
    coachNote += ` (${externalSports.join(', ')} från extern app)`;
  }

  return {
    weekNumber,
    phase: phase?.name || 'Träning',
    theme: phase?.focus || 'Bygg din grund',
    isRecoveryWeek,
    totalVolume: weekVolume,
    workouts,
    coachNote,
    summary: {
      totalMinutes: workouts.reduce((sum, w) => sum + w.duration, 0),
      workoutCount: workouts.length,
      intensityBreakdown: {
        easy: workouts.filter(w => w.intensity === 'easy' || w.intensity === 'long').length,
        moderate: workouts.filter(w => w.intensity === 'moderate').length,
        hard: workouts.filter(w => w.intensity === 'hard').length,
      },
    },
  };
}

/**
 * Generera ett enskilt pass
 */
function generateWorkout(options) {
  const {
    id,
    day,
    sport,
    intensity,
    weekVolume,
    frequency,
    preferredTime,
    sportLevels,
    injuries,
    equipment,
    motivation,
    isRecoveryWeek,
  } = options;

  // Hämta pass-mall
  const sportTemplates = WORKOUT_TEMPLATES[sport] || WORKOUT_TEMPLATES.running;
  const intensityTemplates = sportTemplates[intensity] || sportTemplates.easy;
  const template = getRandomItem(intensityTemplates);

  // Beräkna duration
  let baseDuration = Math.round(weekVolume / frequency);
  baseDuration = Math.round(baseDuration * (template.durationMultiplier || 1));

  // Begränsa till rimliga värden
  baseDuration = Math.max(20, Math.min(120, baseDuration));

  // Bygg passet
  const workout = {
    id,
    day,
    dayName: WEEKDAY_NAMES[day],
    type: sport,
    title: template.title,
    description: template.description,
    duration: baseDuration,
    intensity: intensity === 'long' ? 'easy' : intensity,
    isLongSession: intensity === 'long',
    status: 'scheduled',
  };

  // Lägg till övningar för styrkepass
  if (sport === 'strength') {
    workout.exercises = selectExercises(sport, injuries);
  }

  // Lägg till anpassningar för skador
  if (injuries && injuries.length > 0 && injuries[0] !== 'none') {
    workout.adaptations = [];
    if (injuries.includes('knee')) {
      workout.adaptations.push('Undvik djupa knäböj och hopp');
      workout.adaptations.push('Alternativ: cykel istället för löpning om det behövs');
    }
    if (injuries.includes('back')) {
      workout.adaptations.push('Undvik tunga lyft och rotation');
      workout.adaptations.push('Fokus på core-stabilitet');
    }
    if (injuries.includes('shoulder')) {
      workout.adaptations.push('Undvik övningar över huvudet');
    }
  }

  // Struktur för vissa pass
  if (sport === 'running' && intensity === 'hard') {
    workout.structure = [
      { phase: 'Uppvärmning', duration: 10, description: 'Lätt jogg' },
      { phase: 'Huvudpass', duration: baseDuration - 20, description: 'Intervaller enligt plan' },
      { phase: 'Nedvarvning', duration: 10, description: 'Lugn jogg + stretch' },
    ];
  }

  return workout;
}

/**
 * Framtida: Generera med AI
 */
export async function generateProgramWithAI(profile, apiKey) {
  // TODO: Implementera Claude API-anrop
  // const response = await fetch('https://api.anthropic.com/v1/messages', {
  //   method: 'POST',
  //   headers: {
  //     'x-api-key': apiKey,
  //     'content-type': 'application/json',
  //     'anthropic-version': '2023-06-01',
  //   },
  //   body: JSON.stringify({
  //     model: 'claude-3-5-sonnet-20241022',
  //     max_tokens: 4096,
  //     messages: [{ role: 'user', content: buildAIPrompt(profile) }],
  //   }),
  // });

  // Fallback till template-baserad för nu
  return generateProgram(profile);
}

function buildAIPrompt(profile) {
  // Se docs/onboarding-ai-framework.md för prompt-struktur
  return `...`;
}

export default {
  generateProgram,
  generateProgramWithAI,
};
