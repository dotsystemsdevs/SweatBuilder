import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./navigation/RootNavigator";
import { WorkoutProvider } from "./store/workoutStore";
import { ChatProvider } from "./store/chatStore";
import { ProgramProvider } from "./store/programStore";
import { OnboardingProvider } from "./store/onboardingStore";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary name="App">
      <SafeAreaProvider>
        <OnboardingProvider>
          <WorkoutProvider>
            <ChatProvider>
              <ProgramProvider>
                <RootNavigator />
              </ProgramProvider>
            </ChatProvider>
          </WorkoutProvider>
        </OnboardingProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
