# Settings Screen Analysis - SheetFit App

## Appens Funktioner

### 1. Workout/Training
- Workout history (AsyncStorage)
- Streak tracking
- Stats tracking
- Favorite exercises
- Mood tracking
- Notes

### 2. AI Coach
- AI chat (AIChat screen)
- Chat history (ChatListScreen)
- Multiple AI providers (OpenRouter, OpenAI, Anthropic, Groq)

### 3. Programs
- Training plans/programs
- Active program tracking
- Program history

### 4. Data Storage
- AsyncStorage för workout history
- AsyncStorage för programs
- AsyncStorage för chat history
- Stats och streak data

## Rekommenderade Settings Screens

### Prioritet 1: Kritiska Inställningar

#### 1. **NotificationsSettingsScreen**
**Funktioner:**
- Workout reminders (på/av, tid)
- Streak reminders
- Weekly summary notifications
- Sound & vibration preferences

**Varför:** Appen har notifications placeholder men ingen funktionalitet

#### 2. **AppearanceSettingsScreen**
**Funktioner:**
- Dark Mode toggle (finns redan men fungerar inte)
- Font size preferences
- Haptic feedback intensity

**Varför:** Dark mode finns redan men behöver implementeras

#### 3. **UnitsSettingsScreen**
**Funktioner:**
- Weight units (kg/lbs)
- Distance units (km/miles)
- Temperature units (Celsius/Fahrenheit)

**Varför:** Träningsapp behöver enhetspreferenser

### Prioritet 2: Data & Privacy

#### 4. **DataPrivacySettingsScreen**
**Funktioner:**
- Export workout data (JSON/CSV)
- Clear workout history
- Clear chat history
- Delete all data
- Privacy settings

**Varför:** GDPR compliance och användarkontroll över data

### Prioritet 3: Support & About

#### 5. **HelpSupportScreen**
**Funktioner:**
- FAQ section
- Contact support
- Tutorial/Onboarding
- Keyboard shortcuts

**Varför:** Användarstöd och onboarding

#### 6. **TermsPrivacyScreen** (WebView eller statisk)
**Funktioner:**
- Terms of Service
- Privacy Policy
- Data usage information

**Varför:** Juridisk compliance

### Prioritet 4: Advanced

#### 7. **ConnectedAppsScreen**
**Funktioner:**
- Health app integration (HealthKit/Google Fit)
- Strava integration
- Apple Watch integration
- Future integrations

**Varför:** Extensibility och integrations

#### 8. **AISettingsScreen**
**Funktioner:**
- AI provider selection
- Model selection
- Temperature settings
- Max tokens settings

**Varför:** Appen använder AI och har flera providers konfigurerade

## Nuvarande Settings Structure

```
SettingsScreen
├── Preferences
│   ├── Dark Mode (toggle) ❌ Fungerar inte
│   ├── Notifications → NotificationsSettingsScreen ✅ Behövs
│   └── Connected Apps → ConnectedAppsScreen ✅ Behövs
├── Support
│   ├── Help & Support → HelpSupportScreen ✅ Behövs
│   ├── Send Feedback → Email/Form ✅ Behövs
│   └── Rate App → App Store ✅ Fungerar
├── About
│   ├── Terms of Service → TermsPrivacyScreen ✅ Behövs
│   └── Privacy Policy → TermsPrivacyScreen ✅ Behövs
└── Development (__DEV__)
    └── Summary View ✅ Fungerar
```

## Rekommenderad Implementation Order

1. **NotificationsSettingsScreen** - Hög prioritet, användbar funktion
2. **AppearanceSettingsScreen** - Dark mode behöver fungera
3. **UnitsSettingsScreen** - Viktigt för träningsapp
4. **DataPrivacySettingsScreen** - GDPR compliance
5. **HelpSupportScreen** - Användarstöd
6. **TermsPrivacyScreen** - Juridisk compliance
7. **ConnectedAppsScreen** - Framtida funktionalitet
8. **AISettingsScreen** - Avancerat, kan vara i Development section

## Design Guidelines

Alla settings screens ska följa:
- **Minimal** - Ren design utan onödig information
- **Apple-liknande** - Konsekvent spacing och typografi
- **Simple** - Tydlig navigation och struktur
- **Functional** - Alla inställningar ska fungera


