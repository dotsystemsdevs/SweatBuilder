import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const NewsletterCompletedCard = memo(({ workout, style }) => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={[styles.card, style]}>
      {/* Newspaper header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.newspaper}>THE DAILY FIT</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <View style={styles.headerLine} />
      </View>

      {/* Main headline */}
      <View style={styles.headline}>
        <View style={styles.headlineBar} />
        <Text style={styles.headlineText}>
          WORKOUT COMPLETED SUCCESSFULLY
        </Text>
        <View style={styles.headlineBar} />
      </View>

      {/* Article content */}
      <View style={styles.article}>
        <View style={styles.articleHeader}>
          <Feather name="award" size={20} color="#000000" />
          <Text style={styles.articleTitle}>{workout?.title || "Workout"}</Text>
        </View>

        {workout?.subtitle && (
          <Text style={styles.articleSubtitle}>{workout.subtitle}</Text>
        )}

        {/* Stats in columns */}
        <View style={styles.columns}>
          <View style={styles.column}>
            <Text style={styles.columnLabel}>MOOD</Text>
            <Text style={styles.columnValue}>
              {workout?.mood?.toUpperCase() || "GREAT"}
            </Text>
          </View>
          <View style={styles.columnDivider} />
          <View style={styles.column}>
            <Text style={styles.columnLabel}>EXERCISES</Text>
            <Text style={styles.columnValue}>
              {workout?.exercises?.length || 0}
            </Text>
          </View>
          <View style={styles.columnDivider} />
          <View style={styles.column}>
            <Text style={styles.columnLabel}>TIME</Text>
            <Text style={styles.columnValue}>45m</Text>
          </View>
        </View>

        {/* Quote section */}
        {workout?.notes && (
          <View style={styles.quoteBox}>
            <View style={styles.quoteMark}>
              <Text style={styles.quoteText}>"</Text>
            </View>
            <Text style={styles.quote} numberOfLines={2}>
              {workout.notes}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>EST. 2024 • VOL. 1 • EDITION #{Math.floor(Math.random() * 100)}</Text>
      </View>
    </View>
  );
});

NewsletterCompletedCard.displayName = "NewsletterCompletedCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  newspaper: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 2,
    includeFontPadding: false,
  },
  date: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666666",
    includeFontPadding: false,
  },
  headerLine: {
    height: 3,
    backgroundColor: "#000000",
  },
  headline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  headlineBar: {
    flex: 1,
    height: 1,
    backgroundColor: "#000000",
  },
  headlineText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 1,
    includeFontPadding: false,
  },
  article: {
    marginBottom: 16,
  },
  articleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  articleTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: -0.5,
    includeFontPadding: false,
    flex: 1,
  },
  articleSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 16,
    includeFontPadding: false,
  },
  columns: {
    flexDirection: "row",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#CCCCCC",
    marginBottom: 16,
  },
  column: {
    flex: 1,
    alignItems: "center",
  },
  columnLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#999999",
    letterSpacing: 1,
    marginBottom: 4,
    includeFontPadding: false,
  },
  columnValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000000",
    includeFontPadding: false,
  },
  columnDivider: {
    width: 1,
    backgroundColor: "#CCCCCC",
  },
  quoteBox: {
    borderLeftWidth: 3,
    borderLeftColor: "#000000",
    paddingLeft: 12,
    marginTop: 8,
  },
  quoteMark: {
    position: "absolute",
    left: -8,
    top: -8,
  },
  quoteText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#CCCCCC",
    includeFontPadding: false,
  },
  quote: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666666",
    fontStyle: "italic",
    lineHeight: 18,
    includeFontPadding: false,
  },
  footer: {
    alignItems: "center",
  },
  footerLine: {
    width: "100%",
    height: 2,
    backgroundColor: "#000000",
    marginBottom: 8,
  },
  footerText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#999999",
    letterSpacing: 1,
    includeFontPadding: false,
  },
});

export default NewsletterCompletedCard;






















