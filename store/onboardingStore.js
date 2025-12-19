import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { getStorageItem, setStorageItem } from "../utils/storage";

const OnboardingContext = createContext(null);

const DEFAULT_PROFILE = {
  name: "",
  goal: null,
  experience: null,
  daysPerWeek: 3,
  sessionDuration: 45,
  equipment: [],
  startDate: null,
};

export function OnboardingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState(DEFAULT_PROFILE);

  // Load onboarding state from storage
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const onboardingData = await getStorageItem(STORAGE_KEYS.ONBOARDING);
        const profileData = await getStorageItem(STORAGE_KEYS.USER_PROFILE);

        if (onboardingData?.completed) {
          setHasCompletedOnboarding(true);
        }
        if (profileData) {
          setUserProfile(profileData);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadOnboardingState();
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(async (profile) => {
    const success = await setStorageItem(STORAGE_KEYS.ONBOARDING, {
      completed: true,
      completedAt: new Date().toISOString(),
    });

    if (success) {
      await setStorageItem(STORAGE_KEYS.USER_PROFILE, profile);
      setUserProfile(profile);
      setHasCompletedOnboarding(true);
    }

    return success;
  }, []);

  // Reset onboarding (for dev/settings)
  const resetOnboarding = useCallback(async () => {
    await setStorageItem(STORAGE_KEYS.ONBOARDING, { completed: false });
    await setStorageItem(STORAGE_KEYS.USER_PROFILE, DEFAULT_PROFILE);
    setHasCompletedOnboarding(false);
    setUserProfile(DEFAULT_PROFILE);
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    const newProfile = { ...userProfile, ...updates };
    await setStorageItem(STORAGE_KEYS.USER_PROFILE, newProfile);
    setUserProfile(newProfile);
  }, [userProfile]);

  const value = useMemo(
    () => ({
      isLoading,
      hasCompletedOnboarding,
      userProfile,
      completeOnboarding,
      resetOnboarding,
      updateProfile,
    }),
    [isLoading, hasCompletedOnboarding, userProfile, completeOnboarding, resetOnboarding, updateProfile]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingStore() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboardingStore must be used within OnboardingProvider");
  }
  return ctx;
}
