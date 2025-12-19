import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

// Apple Minimal Clean Design System
const HeatmapCell = ({ intensity }) => {
  const getIntensityColor = () => {
    if (intensity === 0) return "#F5F5F7";
    if (intensity === 1) return "rgba(29, 29, 31, 0.2)";
    if (intensity === 2) return "rgba(29, 29, 31, 0.5)";
    if (intensity === 3) return "rgba(29, 29, 31, 0.75)";
    return "#1D1D1F";
  };

  return (
    <View
      style={[
        styles.heatmapCell,
        { backgroundColor: getIntensityColor() }
      ]}
    />
  );
};

const WorkoutHeatmapCard = memo(({ data = [], totalWorkouts = 0, style }) => {
  // Generate 12 weeks of data (84 days)
  const weeks = useMemo(() => {
    const weeksArray = [];
    for (let week = 0; week < 12; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const index = week * 7 + day;
        days.push({
          intensity: data[index] || 0,
          date: index,
        });
      }
      weeksArray.push(days);
    }
    return weeksArray;
  }, [data]);

  const averagePerWeek = useMemo(() => {
    return (totalWorkouts / 12).toFixed(1);
  }, [totalWorkouts]);

  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>Last 12 weeks</Text>
        </View>
        <View style={styles.statsChip}>
          <Text style={styles.statsChipText}>{totalWorkouts}</Text>
        </View>
      </View>

      {/* Heatmap grid */}
      <View style={styles.heatmapContainer}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekColumn}>
            {week.map((day, dayIndex) => (
              <HeatmapCell
                key={`${weekIndex}-${dayIndex}`}
                intensity={day.intensity}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={styles.legendDots}>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <View
              key={intensity}
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    intensity === 0
                      ? "#F5F5F7"
                      : intensity === 1
                      ? "rgba(29, 29, 31, 0.2)"
                      : intensity === 2
                      ? "rgba(29, 29, 31, 0.5)"
                      : intensity === 3
                      ? "rgba(29, 29, 31, 0.75)"
                      : "#1D1D1F",
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.legendText}>More</Text>
      </View>

      {/* Footer stats */}
      <View style={styles.footer}>
        <View style={styles.footerStat}>
          <Text style={styles.footerValue}>{averagePerWeek}</Text>
          <Text style={styles.footerLabel}>avg/week</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerStat}>
          <Text style={styles.footerValue}>
            {Math.max(...data)}x
          </Text>
          <Text style={styles.footerLabel}>peak day</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerStat}>
          <Text style={styles.footerValue}>
            {Math.round((data.filter(d => d > 0).length / data.length) * 100)}%
          </Text>
          <Text style={styles.footerLabel}>active</Text>
        </View>
      </View>
    </View>
  );
});

WorkoutHeatmapCard.displayName = "WorkoutHeatmapCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1D1D1F",
    letterSpacing: -0.3,
    marginBottom: 4,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#86868B",
    includeFontPadding: false,
  },
  statsChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
  },
  statsChipText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D1D1F",
    includeFontPadding: false,
  },
  heatmapContainer: {
    flexDirection: "row",
    gap: 3,
    marginBottom: 16,
  },
  weekColumn: {
    flex: 1,
    gap: 3,
  },
  heatmapCell: {
    aspectRatio: 1,
    borderRadius: 3,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F5F5F7",
    marginBottom: 12,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#86868B",
    includeFontPadding: false,
  },
  legendDots: {
    flexDirection: "row",
    gap: 4,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  footerStat: {
    alignItems: "center",
    flex: 1,
  },
  footerValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1D1D1F",
    marginBottom: 4,
    includeFontPadding: false,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#86868B",
    includeFontPadding: false,
  },
  footerDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#F5F5F7",
  },
});

export default WorkoutHeatmapCard;
