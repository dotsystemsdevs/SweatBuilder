/**
 * SheetFit Design System
 * ======================
 *
 * THEME STRUCTURE & RULES
 *
 * 1. BACKGROUNDS (darkest to lightest)
 *    - background    → Screen/page background (darkest)
 *    - surface       → Cards, modals, elevated content
 *    - surfaceHover  → Interactive elements (buttons, inputs)
 *    - border        → All borders and dividers
 *
 * 2. TEXT (brightest to dimmest)
 *    - text          → Titles, headings, primary content (white)
 *    - textSecondary → Body text, descriptions (light gray)
 *    - textMuted     → Hints, placeholders, disabled (dark gray)
 *
 * 3. ACCENTS (semantic meaning - use consistently across app)
 *    - yellow  → Today/pending, highlights, energy, start workout button
 *    - green   → Completed/success, goals, save actions
 *    - blue    → Calendar, rest days, info, account
 *    - orange  → Log/reflections, streak/fire, moderate effort
 *    - purple  → AI Coach (all AI-related elements)
 *    - red     → Skipped/missed, danger, delete, high effort
 *
 * 4. EFFORT SCALE (1-10, used in reflections)
 *    1-3  → green  (easy)
 *    4-5  → yellow (moderate)
 *    6-7  → orange (hard)
 *    8-10 → red    (brutal)
 *
 * 5. STATUS INDICATORS (calendar dots, card icons)
 *    - green  → Completed workout
 *    - yellow → Pending/today's workout
 *    - red    → Skipped/missed workout
 *    - blue   → Rest day
 *
 * USAGE RULES:
 *
 * ✓ Cards: surface bg + border + radius.lg
 * ✓ Buttons: surfaceHover bg + border (secondary) or accent color (primary)
 * ✓ Icons on accent backgrounds: Always use 'black'
 * ✓ Text on accent backgrounds: Always use 'black'
 * ✓ AI elements: Always use purple (icons, bubbles, borders when focused)
 * ✓ Haptics: Light for taps, Medium for actions, Heavy for start workout
 */

// =============================================================================
// COLORS
// =============================================================================

const colors = {
  // ─────────────────────────────────────────────────────────────────────────────
  // BACKGROUNDS (from darkest to lightest)
  // ─────────────────────────────────────────────────────────────────────────────
  background: "#0F0F12",      // Screen background - darkest
  surface: "#18181B",         // Cards, modals - slightly lighter
  surfaceHover: "#1A1A1E",    // Interactive surfaces - buttons, inputs
  border: "#27272A",          // All borders and dividers

  // ─────────────────────────────────────────────────────────────────────────────
  // TEXT (from brightest to dimmest)
  // ─────────────────────────────────────────────────────────────────────────────
  text: "#FFFFFF",            // Titles, headings, primary
  textSecondary: "#A1A1AA",   // Body text, descriptions
  textMuted: "#71717A",       // Hints, placeholders, disabled

  // ─────────────────────────────────────────────────────────────────────────────
  // ACCENTS (semantic colors - use consistently!)
  // ─────────────────────────────────────────────────────────────────────────────
  yellow: "#FACC15",          // Today/pending, start workout, energy
  green: "#4ADE80",           // Completed, success, goals, save
  blue: "#38BDF8",            // Calendar, rest days, info
  orange: "#FB923C",          // Log/reflections, streak, moderate effort
  purple: "#A855F7",          // AI Coach (all AI-related UI)
  red: "#EF4444",             // Skipped/missed, danger, high effort

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITY (for contrast on colored backgrounds)
  // ─────────────────────────────────────────────────────────────────────────────
  white: "#FFFFFF",
  black: "#000000",

  // ─────────────────────────────────────────────────────────────────────────────
  // SOFT VARIANTS (20% opacity backgrounds for tinted areas)
  // Usage: Wrap icons, subtle highlights
  // ─────────────────────────────────────────────────────────────────────────────
  yellowSoft: "#3D3A1F",
  greenSoft: "#1A3D2A",
  blueSoft: "#1F2A3D",
  orangeSoft: "#3D2A1F",
  purpleSoft: "#2D1F3D",
  redSoft: "#3D1F1F",

  // ─────────────────────────────────────────────────────────────────────────────
  // OVERLAYS (for modals and elements on colored backgrounds)
  // ─────────────────────────────────────────────────────────────────────────────
  overlay: "rgba(0, 0, 0, 0.5)",         // Modal backgrounds
  overlayDark: "rgba(0, 0, 0, 0.6)",     // Darker modal overlays
  overlayLight: "rgba(0, 0, 0, 0.15)",   // Subtle overlays on accent colors
  overlayText: "rgba(0, 0, 0, 0.6)",     // Text on accent backgrounds
  overlayWhite: "rgba(255, 255, 255, 0.15)", // Shimmer/highlight on dark surfaces
};

// Legacy aliases (for backward compatibility - migrate away from these)
colors.screenBackground = colors.background;
colors.cardBackground = colors.surface;
colors.surfaceMuted = colors.surfaceHover;
colors.outline = colors.border;
colors.textTitle = colors.text;
colors.textBody = colors.textSecondary;
colors.primary = colors.text;
colors.accentYellow = colors.yellow;
colors.accentGreen = colors.green;
colors.accentBlue = colors.blue;
colors.accentOrange = colors.orange;
colors.danger = colors.red;
colors.dangerSoft = colors.redSoft;
colors.success = colors.green;
colors.successSoft = colors.greenSoft;
colors.warning = colors.orange;
colors.warningSoft = colors.orangeSoft;
colors.info = colors.blue;
colors.infoSoft = colors.blueSoft;

// =============================================================================
// SPACING
// =============================================================================

const spacing = {
  xxs: 4,      // Tiny gaps
  xs: 8,       // Icon gaps, small padding
  sm: 12,      // Between related items
  md: 16,      // Standard padding
  lg: 20,      // Section padding
  xl: 24,      // Large gaps
  xxl: 32,     // Section margins
};

// Semantic spacing
spacing.screenPadding = spacing.xl;  // 24px - horizontal screen padding
spacing.sectionGap = spacing.xxl;    // 32px - between major sections

// =============================================================================
// BORDER RADIUS
// =============================================================================

const radius = {
  xs: 8,       // Small elements, badges
  sm: 12,      // Buttons, inputs
  md: 16,      // Cards, modals
  lg: 20,      // Large cards
  xl: 24,      // Hero cards
  full: 999,   // Pills, circles
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

const typography = {
  // Hero - Large display numbers
  hero: {
    fontSize: 72,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -2,
  },
  // H1 - Screen titles
  h1: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  },
  // H2 - Section titles
  h2: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    letterSpacing: -0.3,
  },
  // H3 - Card titles
  h3: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  // Body - Regular text
  body: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // Label - Section headers, uppercase
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Caption - Small text
  caption: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMuted,
  },
};

// =============================================================================
// BUTTONS
// =============================================================================

const buttons = {
  // Primary - White bg, black text (main CTA)
  primary: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
  },
  primaryText: {
    color: colors.black,
    fontWeight: "600",
    fontSize: 17,
  },

  // Secondary - Surface bg with border
  secondary: {
    backgroundColor: colors.surfaceHover,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
  },
  secondaryText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 17,
  },

  // Danger - Red tinted
  danger: {
    backgroundColor: colors.redSoft,
    borderColor: colors.red,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
  },
  dangerText: {
    color: colors.red,
    fontWeight: "600",
    fontSize: 17,
  },
};

// =============================================================================
// CARDS
// =============================================================================

const cards = {
  // Base card style - use for all cards
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
};

// =============================================================================
// SHADOWS (minimal use in dark theme)
// =============================================================================

const shadows = {
  soft: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// =============================================================================
// ACTIVITY COLORS (for workout types)
// =============================================================================

const getActivityColor = (type, variant = "normal") => {
  const colorMap = {
    gym: colors.yellow,
    run: colors.orange,
    long_run: colors.blue,
    cross_training: colors.green,
    race: colors.yellow,
    rest: colors.textMuted,
  };

  const softMap = {
    gym: colors.yellowSoft,
    run: colors.orangeSoft,
    long_run: colors.blueSoft,
    cross_training: colors.greenSoft,
    race: colors.yellowSoft,
    rest: colors.surfaceHover,
  };

  if (variant === "soft") {
    return softMap[type] || colors.surfaceHover;
  }
  return colorMap[type] || colors.yellow;
};

// =============================================================================
// EFFORT COLORS (for workout intensity)
// =============================================================================

// String-based effort (legacy - for predefined labels)
const getEffortColor = (effort) => {
  const effortMap = {
    Easy: colors.green,
    Moderate: colors.yellow,
    Hard: colors.orange,
    Brutal: colors.red,
  };
  return effortMap[effort] || colors.yellow;
};

// Numeric effort scale (1-10) - use this for reflection sliders
// 1-3: Easy (green) → 4-5: Moderate (yellow) → 6-7: Hard (orange) → 8-10: Brutal (red)
const getEffortColorFromValue = (value) => {
  if (!value || value < 1) return colors.textMuted;
  if (value <= 3) return colors.green;
  if (value <= 5) return colors.yellow;
  if (value <= 7) return colors.orange;
  return colors.red;
};

// =============================================================================
// EXPORT
// =============================================================================

const theme = {
  colors,
  spacing,
  radius,
  typography,
  buttons,
  cards,
  shadows,
  getActivityColor,
  getEffortColor,
  getEffortColorFromValue,

  // Legacy (for backward compatibility)
  radii: radius,
  components: {
    cardRadius: radius.lg,
    buttonRadius: radius.md,
    chipRadius: radius.full,
    outlineWidth: 1,
  },
};

export default theme;
