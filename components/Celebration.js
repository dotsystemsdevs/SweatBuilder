import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import theme from "../theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Single confetti particle
const Particle = ({ delay, startX, color }) => {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateParticle = () => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          // Scale in
          Animated.spring(scale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          // Fall down
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT * 0.6,
            duration: 2500,
            useNativeDriver: true,
          }),
          // Drift sideways
          Animated.timing(translateX, {
            toValue: (Math.random() - 0.5) * 150,
            duration: 2500,
            useNativeDriver: true,
          }),
          // Rotate
          Animated.timing(rotate, {
            toValue: Math.random() * 4 - 2,
            duration: 2500,
            useNativeDriver: true,
          }),
          // Fade out at end
          Animated.sequence([
            Animated.delay(1800),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    };

    animateParticle();
  }, [delay, translateY, translateX, opacity, rotate, scale]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-2, 2],
    outputRange: ["-360deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          backgroundColor: color,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
            { scale },
          ],
        },
      ]}
    />
  );
};

// Success checkmark animation
const SuccessCheck = ({ onComplete }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Scale in circle
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Show checkmark
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Hold
      Animated.delay(1500),
      // Fade out
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete?.();
    });
  }, [scale, checkOpacity, onComplete]);

  return (
    <Animated.View style={[styles.successCircle, { transform: [{ scale }] }]}>
      <Animated.View style={{ opacity: checkOpacity }}>
        <View style={styles.checkmark}>
          <View style={styles.checkmarkShort} />
          <View style={styles.checkmarkLong} />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// Main celebration component
export default function Celebration({ visible, onComplete }) {
  if (!visible) return null;

  // Generate confetti particles
  const particles = [];
  const colors = [
    theme.colors.yellow,
    theme.colors.green,
    theme.colors.blue,
    theme.colors.orange,
    theme.colors.purple,
  ];

  for (let i = 0; i < 30; i++) {
    particles.push({
      id: i,
      delay: Math.random() * 400,
      startX: Math.random() * SCREEN_WIDTH,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Confetti */}
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          delay={particle.delay}
          startX={particle.startX}
          color={particle.color}
        />
      ))}

      {/* Success check */}
      <View style={styles.checkContainer}>
        <SuccessCheck onComplete={onComplete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  particle: {
    position: "absolute",
    top: -10,
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  checkContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.green,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    width: 32,
    height: 32,
    position: "relative",
  },
  checkmarkShort: {
    position: "absolute",
    left: 4,
    top: 16,
    width: 10,
    height: 3,
    backgroundColor: theme.colors.black,
    borderRadius: 1.5,
    transform: [{ rotate: "45deg" }],
  },
  checkmarkLong: {
    position: "absolute",
    left: 10,
    top: 12,
    width: 20,
    height: 3,
    backgroundColor: theme.colors.black,
    borderRadius: 1.5,
    transform: [{ rotate: "-45deg" }],
  },
});
