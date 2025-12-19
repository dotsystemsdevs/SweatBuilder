import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";

export default function SonnetBubbleCoachScreen() {
  useStatusBar("#1a1a2e");
  const navigation = useNavigation();
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! 👋 I'm your AI fitness coach. Ask me anything!", isAI: true },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newMessage = { id: Date.now(), text: input, isAI: false };
    setMessages(prev => [...prev, newMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = { 
        id: Date.now() + 1, 
        text: "Great question! This is a bubble design test response with a more playful, rounded aesthetic.", 
        isAI: true 
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1200);
  };

  return (
    <DynamicSafeAreaView style={styles.screen} backgroundColor="#1a1a2e">
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.gradient}
      >
        {/* Floating Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.backButtonGradient}
            >
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Coach</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
          </View>

          <View style={styles.placeholder} />
        </View>

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {/* Bubble Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, index) => (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  msg.isAI ? styles.messageWrapperAI : styles.messageWrapperUser,
                ]}
              >
                {msg.isAI && (
                  <View style={styles.miniAvatar}>
                    <Text style={styles.miniAvatarText}>AI</Text>
                  </View>
                )}
                
                <View style={[
                  styles.bubble,
                  msg.isAI ? styles.bubbleAI : styles.bubbleUser,
                ]}>
                  {msg.isAI && (
                    <LinearGradient
                      colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                      style={styles.bubbleGradient}
                    >
                      <Text style={styles.bubbleText}>{msg.text}</Text>
                    </LinearGradient>
                  )}
                  {!msg.isAI && (
                    <LinearGradient
                      colors={['#00d4ff', '#0099ff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.bubbleGradient}
                    >
                      <Text style={[styles.bubbleText, styles.bubbleTextUser]}>{msg.text}</Text>
                    </LinearGradient>
                  )}
                </View>

                {!msg.isAI && index === messages.length - 1 && (
                  <View style={styles.checkmark}>
                    <Feather name="check" size={12} color="#00d4ff" />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Floating Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Type a message..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handleSend}
                style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                disabled={!input.trim()}
              >
                <LinearGradient
                  colors={input.trim() ? ['#00d4ff', '#0099ff'] : ['#333333', '#222222']}
                  style={styles.sendGradient}
                >
                  <Feather name="send" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </DynamicSafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  backButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00d4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    includeFontPadding: false,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
    includeFontPadding: false,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00FF00",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
    includeFontPadding: false,
  },
  placeholder: {
    width: 44,
  },
  container: {
    flex: 1,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 16,
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  messageWrapperAI: {
    alignSelf: "flex-start",
  },
  messageWrapperUser: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00d4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    includeFontPadding: false,
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 20,
    overflow: "hidden",
  },
  bubbleAI: {
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleText: {
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 20,
    includeFontPadding: false,
  },
  bubbleTextUser: {
    fontWeight: "500",
  },
  checkmark: {
    marginBottom: 4,
  },
  inputContainer: {
    padding: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
    maxHeight: 100,
    includeFontPadding: false,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});






















