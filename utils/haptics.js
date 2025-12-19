import * as Haptics from "expo-haptics";

export const haptic = (type = "impactMedium") => {
  try {
    switch (type) {
      case "impactLight":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "impactMedium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "impactHeavy":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "notificationSuccess":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "notificationWarning":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "notificationError":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "selection":
        Haptics.selectionAsync();
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch {
    // ignore if haptics not available
  }
};

