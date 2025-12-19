import React, { useState, useRef, useEffect } from "react";
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
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";

export default function SonnetTerminalCoachScreen() {
  useStatusBar("#000000");
  const navigation = useNavigation();
  const [messages, setMessages] = useState([
    { id: 1, text: "AI COACH v2.0 INITIALIZED", isAI: true, isSystem: true },
    { id: 2, text: "> Ready for input...", isAI: true },
  ]);
  const [input, setInput] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const cursor = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursor);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newMessage = { id: Date.now(), text: `> ${input}`, isAI: false };
    setMessages(prev => [...prev, newMessage]);
    setInput("");

    // Typing indicator
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now(), text: "...", isAI: true, isTyping: true }]);
    }, 300);

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => prev.filter(m => !m.isTyping));
      const aiMessage = { 
        id: Date.now() + 1, 
        text: `[AI] Processing query... Response generated.`, 
        isAI: true 
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1500);
  };

  return (
    <DynamicSafeAreaView style={styles.screen} backgroundColor="#000000">
      {/* Terminal Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={styles.closeButton}
          >
            <View style={styles.closeCircle} />
          </TouchableOpacity>
          <View style={styles.headerDot} />
          <View style={styles.headerDot} />
        </View>
        <Text style={styles.headerTitle}>TERMINAL</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Terminal Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.terminal}
          contentContainerStyle={styles.terminalContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={styles.line}>
              {msg.isSystem && <Text style={styles.systemPrefix}>SYS:</Text>}
              <Text style={[
                styles.lineText,
                msg.isAI && !msg.isSystem && styles.aiText,
                msg.isSystem && styles.systemText,
                msg.isTyping && styles.typingText,
              ]}>
                {msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Terminal Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.prompt}>$</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={showCursor ? "█" : ""}
            placeholderTextColor="#00FF00"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={styles.sendButton}
            disabled={!input.trim()}
          >
            <Feather name="corner-down-left" size={20} color="#00FF00" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </DynamicSafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#00FF00",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closeButton: {
    width: 12,
    height: 12,
  },
  closeCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF0000",
  },
  headerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#333333",
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#00FF00",
    letterSpacing: 2,
    includeFontPadding: false,
  },
  placeholder: {
    width: 60,
  },
  container: {
    flex: 1,
  },
  terminal: {
    flex: 1,
  },
  terminalContent: {
    padding: 16,
  },
  line: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 8,
  },
  systemPrefix: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF00FF",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    includeFontPadding: false,
  },
  lineText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    includeFontPadding: false,
  },
  aiText: {
    color: "#00FF00",
  },
  systemText: {
    color: "#FFFF00",
  },
  typingText: {
    color: "#00FF00",
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: "#00FF00",
    backgroundColor: "#0a0a0a",
  },
  prompt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00FF00",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    includeFontPadding: false,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    includeFontPadding: false,
  },
  sendButton: {
    padding: 4,
  },
});






















