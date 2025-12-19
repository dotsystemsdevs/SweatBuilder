import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { getStorageItem, setStorageItem } from "../utils/storage";
import { logError } from "../utils/errorHandler";
import { generateNumericId } from "../utils/idGenerator";
import { getCurrentTimestamp } from "../utils/dateFormatters";
import { getInitialPrograms, getDefaultProgramId } from "../__mocks__/programData";

const ProgramContext = createContext(null);

export function ProgramProvider({ children }) {
  const [programs, setPrograms] = useState(() => getInitialPrograms());
  const [activeProgramId, setActiveProgramId] = useState(() => getDefaultProgramId());

  // Load programs from storage
  useEffect(() => {
    const loadPrograms = async () => {
      const stored = await getStorageItem(STORAGE_KEYS.WORKOUT_PROGRAMS);
      if (stored) {
        setPrograms(stored.programs || getInitialPrograms());
        setActiveProgramId(stored.activeProgramId || getDefaultProgramId());
      }
    };
    loadPrograms();
  }, []);

  // Save programs to storage
  const savePrograms = useCallback(async (newPrograms, newActiveId) => {
    const success = await setStorageItem(STORAGE_KEYS.WORKOUT_PROGRAMS, {
      programs: newPrograms,
      activeProgramId: newActiveId || activeProgramId,
    });

    if (success) {
      setPrograms(newPrograms);
      if (newActiveId) {
        setActiveProgramId(newActiveId);
      }
    } else {
      logError("ProgramStore", new Error("Failed to save programs"));
    }
  }, [activeProgramId]);

  // Get active program
  const getActiveProgram = useCallback(() => {
    return programs.find((p) => p.id === activeProgramId) || programs[0];
  }, [programs, activeProgramId]);

  // Create new program
  const createProgram = useCallback(
    async (programData) => {
      const timestamp = getCurrentTimestamp();
      const newProgram = {
        ...programData,
        id: generateNumericId(),
        createdAt: timestamp,
        updatedAt: timestamp,
        isActive: false,
      };
      const updatedPrograms = [...programs, newProgram];
      await savePrograms(updatedPrograms);
      return newProgram;
    },
    [programs, savePrograms]
  );

  // Update program
  const updateProgram = useCallback(
    async (programId, updates) => {
      const updatedPrograms = programs.map((p) =>
        p.id === programId
          ? { ...p, ...updates, updatedAt: getCurrentTimestamp() }
          : p
      );
      await savePrograms(updatedPrograms);
    },
    [programs, savePrograms]
  );

  // Delete program
  const deleteProgram = useCallback(
    async (programId) => {
      const updatedPrograms = programs.filter((p) => p.id !== programId);
      await savePrograms(updatedPrograms);
      
      // If deleted program was active, set first program as active
      if (activeProgramId === programId && updatedPrograms.length > 0) {
        setActiveProgramId(updatedPrograms[0].id);
        await savePrograms(updatedPrograms, updatedPrograms[0].id);
      }
    },
    [programs, activeProgramId, savePrograms]
  );

  // Set active program
  const setActiveProgram = useCallback(
    async (programId) => {
      const updatedPrograms = programs.map((p) => ({
        ...p,
        isActive: p.id === programId,
      }));
      await savePrograms(updatedPrograms, programId);
    },
    [programs, savePrograms]
  );

  const value = useMemo(
    () => ({
      programs,
      activeProgramId,
      getActiveProgram,
      createProgram,
      updateProgram,
      deleteProgram,
      setActiveProgram,
    }),
    [
      programs,
      activeProgramId,
      getActiveProgram,
      createProgram,
      updateProgram,
      deleteProgram,
      setActiveProgram,
    ]
  );

  return <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>;
}

export function useProgramStore() {
  const ctx = useContext(ProgramContext);
  if (!ctx) {
    throw new Error("useProgramStore must be used within ProgramProvider");
  }
  return ctx;
}
