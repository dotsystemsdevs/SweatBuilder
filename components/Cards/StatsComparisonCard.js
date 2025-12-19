import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

// Apple Minimal Clean Design System
const StatItem = memo(({ icon, label, value, change, isPositive }) => {
  return (
    <View style={statStyles.item}>
      <View style={statStyles.iconRow}>
        <View style={statStyles.iconContainer}>
          <Feather name={icon} size={16} color="#1D1D1F" />
        </View>
        {change && (
          <View style={[statStyles.changeContainer, isPositive ? statStyles.positive : statStyles.negative]}>
            <Feather
              name={isPositive ? "trending-up" : "trending-down"}
              size={10}
              color={isPositive ? "#1D1D1F" : "#86868B"}
            />
            <Text style={[statStyles.changeText, isPositive ? statStyles.positiveText : statStyles.negativeText]}>
              {change}
            </Text>
          </View>
        )}
      </View>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
});

StatItem.displayName = "StatItem";

const StatsComparisonCard = memo(({ title = "Weekly Progress", stats = [], style }) => {
  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {/* Stats Grid - 2x2 */}
      <View style={styles.statsGrid}>
        {stats.slice(0, 4).map((stat, index) => (
          <StatItem
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            isPositive={stat.isPositive}
          />
        ))}
      </View>
    </View>
  );
});

StatsComparisonCard.displayName = "StatsComparisonCard";

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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1D1D1F",
    includeFontPadding: false,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
});

const statStyles = StyleSheet.create({
  item: {
    width: "50%",
    padding: 8,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1D1D1F",
    letterSpacing: -0.5,
    marginBottom: 4,
    includeFontPadding: false,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#86868B",
    includeFontPadding: false,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  positive: {
    backgroundColor: "#F5F5F7",
  },
  negative: {
    backgroundColor: "#F5F5F7",
  },
  changeText: {
    fontSize: 11,
    fontWeight: "600",
    includeFontPadding: false,
  },
  positiveText: {
    color: "#1D1D1F",
  },
  negativeText: {
    color: "#86868B",
  },
});

export default StatsComparisonCard;
