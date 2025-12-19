# SheetFit Onboarding AI Framework

## 1. INPUT - Data vi samlar in

### Obligatoriska frågor
| Fråga | Syfte | Påverkar output |
|-------|-------|-----------------|
| Namn | Personalisering | Alla meddelanden |
| Sporter | Vilka aktiviteter att schemalägga | Passtyper |
| Nivå per sport | Intensitet & komplexitet | Svårighetsgrad |
| Huvudmål | Programstruktur | Periodisering |
| Nuvarande träningsstatus | Startpunkt | Volym vecka 1 |
| Dagar/vecka | Frekvens | Antal pass |
| Vilka dagar | Schemaläggning | Vilka veckodagar |
| Tid på dygnet | Passtyp-optimering | Morgon=lätt, kväll=intensivt |
| Utrustning | Vad som är möjligt | Övningsval |
| Skador | Undvik övningar | Anpassningar |
| Motivation | Ton & kommunikation | Coachstil |

### Villkorliga frågor (om lopp)
| Fråga | Syfte |
|-------|-------|
| Vilket lopp | Specifik träning |
| Loppdatum | Countdown & periodisering |
| Distans | Volymplanering |
| Tidsmål | Intensitetszoner |

### Villkorliga frågor (om externa appar)
| Fråga | Syfte |
|-------|-------|
| Vilken app | Integration |
| Vilka passtyper | Undvik dubblering |

---

## 2. OUTPUT - Vad AI:n ska producera

### A. Träningsprogram (Program)
```javascript
{
  id: "generated-uuid",
  name: "Göteborgsvarvet 2025",

  // Metadata
  goal: "race", // race | improve | health | weight | strength | habit
  targetDate: "2025-05-17", // om lopp
  duration: 16, // veckor
  startDate: "2025-01-20",

  // Användarprofil
  userProfile: {
    name: "Erik",
    sports: ["running", "strength"],
    sportLevels: { running: "intermediate", strength: "beginner" },
    currentStatus: "3-4", // ggr/vecka
    equipment: ["gym", "outdoors"],
    injuries: ["knee"],
    motivation: "balanced"
  },

  // Schema
  schedule: {
    daysPerWeek: 4,
    preferredDays: ["mon", "wed", "fri", "sun"],
    preferredTime: "morning"
  },

  // Externa appar
  externalSources: {
    wahoo: ["cycling"] // dessa pass kommer från Wahoo
  },

  // Fasindelning
  phases: [
    { name: "Bas", weeks: [1, 2, 3, 4], focus: "Bygga grund" },
    { name: "Uppbyggnad", weeks: [5, 6, 7, 8, 9, 10], focus: "Öka volym" },
    { name: "Specifik", weeks: [11, 12, 13, 14], focus: "Loppspecifik" },
    { name: "Toppning", weeks: [15, 16], focus: "Vila & skärpa" }
  ]
}
```

### B. Veckoschema (WeekPlan)
```javascript
{
  weekNumber: 5,
  phase: "Uppbyggnad",
  theme: "Öka distans på långpasset",
  totalLoad: 75, // % av maxkapacitet

  workouts: [
    {
      id: "w5-1",
      day: "mon",
      type: "running",
      title: "Lätt löpning",
      duration: 45, // minuter
      intensity: "easy", // easy | moderate | hard | race
      description: "Lugnt tempo, konversationsfart",
      details: {
        distance: "7 km",
        pace: "5:30-6:00 /km",
        heartRate: "Zone 2"
      }
    },
    {
      id: "w5-2",
      day: "wed",
      type: "strength",
      title: "Styrka - Ben",
      duration: 50,
      intensity: "moderate",
      description: "Fokus på löparstyrka",
      exercises: [
        { name: "Knäböj", sets: 3, reps: 12, note: "Lätt vikt pga knä" },
        { name: "Utfall", sets: 3, reps: 10, note: "Per ben" },
        { name: "Benspark", sets: 3, reps: 15 },
        { name: "Vadpress", sets: 3, reps: 15 }
      ]
    },
    {
      id: "w5-3",
      day: "fri",
      type: "running",
      title: "Intervaller",
      duration: 55,
      intensity: "hard",
      description: "5x1000m med 2 min vila",
      details: {
        warmup: "15 min lätt jogg",
        main: "5 x 1000m @ 4:30/km, 2 min gång mellan",
        cooldown: "10 min lätt jogg"
      }
    },
    {
      id: "w5-4",
      day: "sun",
      type: "running",
      title: "Långpass",
      duration: 90,
      intensity: "easy",
      description: "Bygga uthållighet",
      details: {
        distance: "15 km",
        pace: "5:45-6:15 /km",
        note: "Ta det lugnt, fokus på tid på fötter"
      }
    }
  ],

  // Veckosammanfattning
  summary: {
    totalTime: 240, // minuter
    runningKm: 32,
    strengthSessions: 1,
    intensityDistribution: {
      easy: 70,
      moderate: 15,
      hard: 15
    }
  },

  // Coach-meddelande
  coachNote: "Bra jobbat med förra veckan! Nu ökar vi långpasset lite. Lyssna på kroppen och knät."
}
```

### C. Enskilt pass (Workout)
```javascript
{
  id: "unique-id",
  programId: "program-id",
  weekNumber: 5,

  // Grundinfo
  type: "running", // running | cycling | swimming | strength | yoga | etc
  title: "Tempolöpning",
  date: "2025-02-12",
  scheduledTime: "07:00",

  // Detaljer
  duration: 50, // minuter
  intensity: "moderate",

  // Beskrivning (anpassad efter motivation-stil)
  description: "Idag kör vi tempo! 20 min i tävlingsfart - du klarar det!",

  // Struktur
  structure: [
    { phase: "Uppvärmning", duration: 10, description: "Lätt jogg" },
    { phase: "Huvudpass", duration: 20, description: "Tempolöpning @ 4:45/km" },
    { phase: "Nedvarvning", duration: 10, description: "Lugn jogg + stretch" }
  ],

  // För styrkepass
  exercises: null, // eller array av övningar

  // Anpassningar
  adaptations: [
    "Undvik djupa knäböj pga knäskada",
    "Alternativ: cykel om knät känns"
  ],

  // Status
  status: "scheduled", // scheduled | completed | skipped

  // Efter genomfört pass
  result: null // fylls i efter passet
}
```

---

## 3. AI INSTRUKTIONER - Checklista för programgenerering

### Fas 1: Analysera användarprofil

```markdown
## Användarprofil-analys

INNAN du skapar programmet, analysera:

1. **Mål-typ**
   - [ ] Race: Räkna veckor till loppet, skapa periodisering
   - [ ] Förbättring: Fokus på progressiv överbelastning
   - [ ] Hälsa: Balans mellan aktiviteter, låg skaderisk
   - [ ] Vikt: Högre frekvens, blandade aktiviteter
   - [ ] Styrka: Fokus på styrkepass, kompletterande kondition
   - [ ] Vana: Enkla pass, hög följsamhet

2. **Nuvarande nivå**
   - [ ] Tränar inte → Börja med 2-3 pass/vecka, låg intensitet
   - [ ] Sporadiskt → Struktur viktigare än volym
   - [ ] 1-2 ggr → Öka gradvis till målfrekvens
   - [ ] 3-4 ggr → Optimera befintlig träning
   - [ ] 5+ ggr → Fokus på kvalitet, återhämtning

3. **Skador/begränsningar**
   - [ ] Knä: Undvik hopp, djupa böj, hård löpning på asfalt
   - [ ] Rygg: Undvik tunga lyft, rotation under belastning
   - [ ] Axel: Undvik överhuvudpress, vissa simtag
   - [ ] Ge ALLTID alternativövningar
```

### Fas 2: Skapa programstruktur

```markdown
## Programstruktur

1. **Beräkna programlängd**
   - Race: Veckor till lopp (min 4, max 24)
   - Övrigt: 8-12 veckor som default

2. **Skapa faser** (för löplopp)
   | Fas | Andel | Fokus |
   |-----|-------|-------|
   | Bas | 25% | Aerob grund, teknik |
   | Uppbyggnad | 40% | Öka volym gradvis |
   | Specifik | 25% | Loppspecifik träning |
   | Toppning | 10% | Vila, skärpa |

3. **Veckostruktur**
   - [ ] Fördela intensitet: 80% lätt, 20% hårt
   - [ ] Max 2 hårda pass med minst 48h mellan
   - [ ] Långpass på helg (mer tid)
   - [ ] Styrka 1-2 ggr/vecka
   - [ ] Minst 1 vilodag
```

### Fas 3: Skapa veckoscheman

```markdown
## Veckoschema-generering

För varje vecka:

1. **Respektera externa appar**
   - [ ] Om cykling från Wahoo → Lägg INTE in cykelpass
   - [ ] Markera dessa dagar som "extern träning"

2. **Fördela passtyper**
   - [ ] Sprid hårda pass (ej 2 i rad)
   - [ ] Placera långpass när tid finns (helg)
   - [ ] Styrka efter/separat från hårt konditionspass

3. **Anpassa till tid på dygnet**
   - Morgon: Kortare, enklare pass
   - Lunch: Effektiva intervaller
   - Eftermiddag: Längre pass möjliga
   - Kväll: Styrka, lugna pass

4. **Progressiv belastning**
   - Vecka 1: 60% av målvolym
   - Öka med ~10% per vecka
   - Var 4:e vecka: Lätt vecka (-20%)
```

### Fas 4: Kommunikationsstil

```markdown
## Anpassa coachstil

Baserat på motivations-preferens:

**"Pusha mig hårt!"**
- Direkta uppmaningar
- "Inga ursäkter idag!"
- Utmanande språk
- Fokus på mål och resultat

**"Balanserat"**
- Uppmuntrande men realistiskt
- "Bra jobbat! Nu kör vi vidare."
- Förklara varför pass är viktiga

**"Snäll och stöttande"**
- Empatiskt språk
- "Lyssna på kroppen"
- Bekräfta ansträngning
- Ge utrymme för flexibilitet

**"Ge mig datan"**
- Siffror och statistik
- Fysiologiska förklaringar
- Grafer och progression
- Minimal fluff
```

---

## 4. VALIDERING - Kontrollpunkter

```markdown
## Innan programmet levereras, verifiera:

### Grundläggande
- [ ] Antal pass/vecka matchar användarens val
- [ ] Pass ligger på valda dagar
- [ ] Inga pass på skadade kroppsdelar utan anpassning
- [ ] Externa app-pass respekteras

### Belastning
- [ ] Vecka 1 är hanterbar baserat på nuvarande status
- [ ] Progressionen är gradvis (max 10%/vecka)
- [ ] Det finns lättare veckor var 3-4:e vecka
- [ ] Intensitetsfördelning: ~80% lätt, ~20% hårt

### För lopp
- [ ] Programmet slutar på loppdagen
- [ ] Toppningsvecka(or) före loppet
- [ ] Loppspecifik träning i specifik fas
- [ ] Längsta pass är minst 60-70% av loppdistans

### Användarupplevelse
- [ ] Coachstil matchar preferens
- [ ] Namn används i kommunikation
- [ ] Pass har tydliga instruktioner
- [ ] Alternativ ges för skador
```

---

## 5. EXEMPEL - Prompt till AI

```
Du ska skapa ett träningsprogram baserat på följande användarprofil:

ANVÄNDARE:
- Namn: Erik
- Sporter: Löpning (mellannivå), Styrka (nybörjare)
- Mål: Göteborgsvarvet 2025-05-17 (halvmaraton)
- Tidsmål: Under 1:50
- Nuvarande träning: 3-4 ggr/vecka
- Schema: 4 dagar/vecka (mån, ons, fre, sön), morgon
- Utrustning: Gym, utomhus
- Skador: Lätt knäbesvär
- Externa appar: Inga
- Coachstil: Balanserat

INSTRUKTIONER:
1. Räkna ut veckor till loppet
2. Skapa periodisering (Bas → Uppbyggnad → Specifik → Toppning)
3. Generera veckoscheman med:
   - 2-3 löppass (lätt, intervall, långpass)
   - 1 styrkepass (löparstyrka, knävänligt)
4. Progression: Börja på ~30 km/vecka, bygg till ~50 km/vecka
5. Inkludera tempo/fartlek för 1:50-målet
6. Anpassa övningar för knäbesvär
7. Använd balanserad coachstil i beskrivningar

OUTPUT FORMAT:
[Se OUTPUT-specifikationen ovan]
```

---

## 6. DATAMODELL - TypeScript interfaces

```typescript
interface UserProfile {
  name: string;
  sports: Sport[];
  sportLevels: Record<Sport, Level>;
  currentStatus: TrainingStatus;
  equipment: Equipment[];
  injuries: Injury[];
  motivation: MotivationStyle;
}

interface Schedule {
  daysPerWeek: number;
  preferredDays: Weekday[];
  preferredTime: TimeOfDay;
}

interface Goal {
  type: GoalType;
  race?: RaceInfo;
  timeGoal?: string;
}

interface ExternalSources {
  [app: string]: Sport[];
}

interface Program {
  id: string;
  name: string;
  userProfile: UserProfile;
  schedule: Schedule;
  goal: Goal;
  externalSources: ExternalSources;
  duration: number;
  startDate: string;
  phases: Phase[];
  weeks: WeekPlan[];
}

interface WeekPlan {
  weekNumber: number;
  phase: string;
  theme: string;
  workouts: Workout[];
  coachNote: string;
}

interface Workout {
  id: string;
  day: Weekday;
  type: Sport;
  title: string;
  duration: number;
  intensity: Intensity;
  description: string;
  structure?: WorkoutPhase[];
  exercises?: Exercise[];
  adaptations?: string[];
}

type Sport = 'running' | 'cycling' | 'swimming' | 'strength' | 'yoga' | 'hiking' | 'skiing' | 'triathlon' | 'crossfit';
type Level = 'beginner' | 'intermediate' | 'advanced' | 'elite';
type GoalType = 'race' | 'improve' | 'health' | 'weight' | 'strength' | 'habit';
type Intensity = 'easy' | 'moderate' | 'hard' | 'race';
type MotivationStyle = 'tough' | 'balanced' | 'gentle' | 'data';
type TimeOfDay = 'morning' | 'lunch' | 'afternoon' | 'evening' | 'flexible';
type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
```
