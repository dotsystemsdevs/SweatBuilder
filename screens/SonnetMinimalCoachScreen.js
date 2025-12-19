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
import * as Haptics from "expo-haptics";
import theme from "../theme";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";

export default function SonnetMinimalCoachScreen() {
  useStatusBar("#FFFFFF");
  const navigation = useNavigation();
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I help you today?", isAI: true },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newMessage = { id: Date.now(), text: input, isAI: false };
    setMessages(prev => [...prev, newMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = { 
        id: Date.now() + 1, 
        text: "This is a minimal design test response.", 
        isAI: true 
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <DynamicSafeAreaView style={styles.screen} backgroundColor="#FFFFFF">
      {/* Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.dot} />
          <Text style={styles.headerTitle}>Coach</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.message,
                msg.isAI ? styles.messageAI : styles.messageUser,
              ]}
            >
              <Text style={[styles.messageText, msg.isAI && styles.messageTextAI]}>
                {msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Minimal Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Message"
              placeholderTextColor="#999999"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              disabled={!input.trim()}
            >
              <Feather name="arrow-up" size={20} color={input.trim() ? "#FFFFFF" : "#CCCCCC"} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </DynamicSafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00FF00",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    includeFontPadding: false,
  },
  placeholder: {
    width: 40,
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
  message: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageAI: {
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F5",
  },
  messageUser: {
    alignSelf: "flex-end",
    backgroundColor: "#000000",
  },
  messageText: {
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 20,
    includeFontPadding: false,
  },
  messageTextAI: {
    color: "#000000",
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000000",
    maxHeight: 100,
    includeFontPadding: false,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#F0F0F0",
  },
});






















