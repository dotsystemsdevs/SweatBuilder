import React, { memo, useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  Animated,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
import theme from "../../theme";

const ExerciseNoteModal = memo(({
  visible,
  noteValue,
  onChangeNote,
  onClose,
  exercises,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const inputRef = useRef(null);

  // Simple text state
  const [text, setText] = useState(noteValue || '');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  // Sync with noteValue when modal opens
  useEffect(() => {
    if (visible) {
      setText(noteValue || '');
    }
  }, [visible, noteValue]);

  // Slide in animation when visible
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
      // Auto-focus
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [visible, slideAnim]);

  // Handle text change with @-mention detection
  const handleTextChange = useCallback((newText) => {
    setText(newText);
    onChangeNote(newText);

    // Check for @ at end of text or after space
    const lastAtIndex = newText.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = newText.slice(lastAtIndex + 1);
      // Show dropdown if @ is recent and no space after
      if (!afterAt.includes(' ') && newText.length - lastAtIndex < 20) {
        setMentionFilter(afterAt.toLowerCase());
        setShowMentionDropdown(true);
        return;
      }
    }
    setShowMentionDropdown(false);
  }, [onChangeNote]);

  // Filter exercises for @-mention dropdown
  const filteredExercises = useMemo(() => {
    if (!exercises || exercises.length === 0) return [];
    if (!mentionFilter) return exercises.slice(0, 4);
    return exercises.filter(ex =>
      ex.name.toLowerCase().includes(mentionFilter)
    ).slice(0, 4);
  }, [exercises, mentionFilter]);

  // Insert @-mention
  const insertMention = useCallback((exerciseName) => {
    const lastAtIndex = text.lastIndexOf('@');
    const newText = text.slice(0, lastAtIndex) + '@' + exerciseName.replace(/\s+/g, '') + ' ';
    setText(newText);
    onChangeNote(newText);
    setShowMentionDropdown(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Re-focus input
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [text, onChangeNote]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.container,
            {
              paddingBottom: insets.bottom + theme.spacing.md,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>Notes</Text>
            <TouchableOpacity onPress={handleClose} style={styles.doneButton}>
              <Feather name="check" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Simple textarea */}
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Add notes... type @ to mention exercise"
              placeholderTextColor={theme.colors.textMuted}
              value={text}
              onChangeText={handleTextChange}
              multiline
              textAlignVertical="top"
            />

            {/* @-mention dropdown */}
            {showMentionDropdown && filteredExercises.length > 0 && (
              <View style={styles.mentionDropdown}>
                {filteredExercises.map((ex) => (
                  <TouchableOpacity
                    key={ex.id}
                    style={styles.mentionItem}
                    onPress={() => insertMention(ex.name)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.mentionText}>@{ex.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

ExerciseNoteModal.displayName = "ExerciseNoteModal";

ExerciseNoteModal.propTypes = {
  visible: PropTypes.bool,
  noteValue: PropTypes.string,
  onChangeNote: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  exercises: PropTypes.array,
};

ExerciseNoteModal.defaultProps = {
  visible: false,
  noteValue: "",
  exercises: [],
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.textTitle,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  doneButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrapper: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.textTitle,
    minHeight: 100,
    maxHeight: 200,
    lineHeight: 20,
  },
  mentionDropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  mentionItem: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  mentionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
});

export default ExerciseNoteModal;
