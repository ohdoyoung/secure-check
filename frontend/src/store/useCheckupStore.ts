import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnalysisResult, CodeFile, InputMode, PastedCodeLanguageOption } from "../types/analysis";
import { exampleSpringCode } from "../lib/fileReaders";

type CheckupState = {
  inputMode: InputMode;
  projectName: string;
  rawCode: string;
  pastedCodeLanguage: PastedCodeLanguageOption;
  stagedFiles: CodeFile[];
  resultFiles: CodeFile[];
  result?: AnalysisResult;
  history: AnalysisResult[];
  setInputMode: (mode: InputMode) => void;
  setProjectName: (name: string) => void;
  setRawCode: (code: string) => void;
  setPastedCodeLanguage: (language: PastedCodeLanguageOption) => void;
  setStagedFiles: (files: CodeFile[]) => void;
  setResultFiles: (files: CodeFile[]) => void;
  setResult: (result: AnalysisResult) => void;
  loadExample: () => void;
};

export const useCheckupStore = create<CheckupState>()(
  persist(
    (set) => ({
      inputMode: "zip",
      projectName: "취약했네 샘플 프로젝트",
      rawCode: exampleSpringCode(),
      pastedCodeLanguage: "auto",
      stagedFiles: [],
      resultFiles: [],
      result: undefined,
      history: [],
      setInputMode: (mode) => set({ inputMode: mode }),
      setProjectName: (name) => set({ projectName: name }),
      setRawCode: (code) => set({ rawCode: code }),
      setPastedCodeLanguage: (language) => set({ pastedCodeLanguage: language }),
      setStagedFiles: (files) => set({ stagedFiles: files }),
      setResultFiles: (files) => set({ resultFiles: files }),
      setResult: (result) =>
        set((state) => ({
          result,
          history: [result, ...state.history.filter((item) => item.analyzedAt !== result.analyzedAt)].slice(0, 8)
        })),
      loadExample: () =>
        set({
          inputMode: "paste",
          projectName: "Spring Boot 건강검진 샘플",
          rawCode: exampleSpringCode(),
          pastedCodeLanguage: "auto",
          stagedFiles: []
        })
    }),
    {
      name: "chwiyakhaenne-checkup",
      partialize: (state) => ({
        projectName: state.projectName,
        rawCode: state.rawCode,
        pastedCodeLanguage: state.pastedCodeLanguage,
        history: state.history
      })
    }
  )
);
