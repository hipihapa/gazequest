import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QUESTIONS_BY_CATEGORY } from '@/constants/questions';
import { selectRandomItems } from '@/lib/arrayUtils';

export type GameStage = 'intro' | 'permission' | 'calibration' | 'category' | 'questions' | 'results';

export type QuestionCategory = 'food' | 'sex' | 'movie' | 'music' | 'sports' | 'personal';

export type CalibrationDirection = 'center' | 'left' | 'right' | 'up' | 'down';

export interface CalibrationData {
  center: { x: number; y: number } | null;
  left: { x: number; y: number } | null;
  right: { x: number; y: number } | null;
  up: { x: number; y: number } | null;
  down: { x: number; y: number } | null;
}

export interface QuestionData {
  id: number;
  text: string;
  answer: string | null;
  responseTime: number;
  gazeStability: number;
  blinkRate: number;
  headMovement: number;
  lookAwayCount: number;
  verdict: 'truthful' | 'suspicious' | null;
  verdictConfidence: number;
  trackingQuality: 'excellent' | 'good' | 'fair' | 'poor' | null;
}

export interface BehaviorMetrics {
  avgGazeStability: number;
  avgBlinkRate: number;
  avgHeadMovement: number;
  avgResponseTime: number;
  totalLookAways: number;
  confidenceScore: number;
  verdict: 'confident' | 'mixed' | 'suspicious';
}

interface GameState {
  stage: GameStage;
  cameraPermission: boolean | null;
  calibrationData: CalibrationData;
  currentCalibrationStep: CalibrationDirection | null;
  selectedCategory: QuestionCategory | null;
  questions: QuestionData[];
  currentQuestionIndex: number;
  behaviorMetrics: BehaviorMetrics | null;
  
  // Tracking state
  isTracking: boolean;
  currentGazePosition: { x: number; y: number } | null;
  blinkCount: number;
  
  // Actions
  setStage: (stage: GameStage) => void;
  setCameraPermission: (granted: boolean) => void;
  setCalibrationData: (direction: CalibrationDirection, data: { x: number; y: number }) => void;
  setCurrentCalibrationStep: (step: CalibrationDirection | null) => void;
  setSelectedCategory: (category: QuestionCategory) => void;
  updateQuestionData: (index: number, data: Partial<QuestionData>) => void;
  nextQuestion: () => void;
  setCurrentGazePosition: (pos: { x: number; y: number } | null) => void;
  incrementBlinkCount: () => void;
  setIsTracking: (tracking: boolean) => void;
  calculateResults: () => void;
  resetGame: () => void;
}

const getQuestionsForCategory = (category: QuestionCategory): QuestionData[] => {
  const categoryQuestions = QUESTIONS_BY_CATEGORY[category];
  
  // Randomly select 5 questions from the pool
  const selectedQuestions = selectRandomItems(categoryQuestions, 5);
  
  return selectedQuestions.map(q => ({
    ...q,
    answer: null,
    responseTime: 0,
    gazeStability: 100,
    blinkRate: 0,
    headMovement: 0,
    lookAwayCount: 0,
    verdict: null,
    verdictConfidence: 0,
    trackingQuality: null,
  }));
};

const initialQuestions: QuestionData[] = getQuestionsForCategory('personal');

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      stage: 'intro',
      cameraPermission: null,
      calibrationData: {
        center: null,
        left: null,
        right: null,
        up: null,
        down: null,
      },
      currentCalibrationStep: null,
      selectedCategory: null,
      questions: initialQuestions,
      currentQuestionIndex: 0,
      behaviorMetrics: null,
      isTracking: false,
      currentGazePosition: null,
      blinkCount: 0,

      setStage: (stage) => set({ stage }),
      
      setCameraPermission: (granted) => set({ cameraPermission: granted }),
      
      setCalibrationData: (direction, data) => set((state) => ({
        calibrationData: { ...state.calibrationData, [direction]: data }
      })),
      
      setCurrentCalibrationStep: (step) => set({ currentCalibrationStep: step }),
      
      setSelectedCategory: (category) => set({
        selectedCategory: category,
        questions: getQuestionsForCategory(category),
        currentQuestionIndex: 0,
      }),
      
      updateQuestionData: (index, data) => set((state) => ({
        questions: state.questions.map((q, i) => i === index ? { ...q, ...data } : q)
      })),
      
      nextQuestion: () => set((state) => ({
        currentQuestionIndex: state.currentQuestionIndex + 1,
        blinkCount: 0,
      })),
      
      setCurrentGazePosition: (pos) => set({ currentGazePosition: pos }),
      
      incrementBlinkCount: () => set((state) => ({ blinkCount: state.blinkCount + 1 })),
      
      setIsTracking: (tracking) => set({ isTracking: tracking }),
      
      calculateResults: () => {
        const { questions } = get();
        
        const avgGazeStability = questions.reduce((acc, q) => acc + q.gazeStability, 0) / questions.length;
        const avgBlinkRate = questions.reduce((acc, q) => acc + q.blinkRate, 0) / questions.length;
        const avgHeadMovement = questions.reduce((acc, q) => acc + q.headMovement, 0) / questions.length;
        const avgResponseTime = questions.reduce((acc, q) => acc + q.responseTime, 0) / questions.length;
        const totalLookAways = questions.reduce((acc, q) => acc + q.lookAwayCount, 0);
        
        // Calculate confidence score (lower is more confident)
        let suspicionScore = 0;
        
        // Gaze stability (lower stability = more suspicious)
        if (avgGazeStability < 60) suspicionScore += 3;
        else if (avgGazeStability < 80) suspicionScore += 1;
        else suspicionScore -= 2;
        
        // Blink rate (higher = more nervous)
        if (avgBlinkRate > 20) suspicionScore += 2;
        else if (avgBlinkRate > 10) suspicionScore += 1;
        else suspicionScore -= 1;
        
        // Head movement (higher = more avoidance)
        if (avgHeadMovement > 30) suspicionScore += 2;
        else if (avgHeadMovement > 15) suspicionScore += 1;
        
        // Response time (slower = less confident)
        if (avgResponseTime > 5000) suspicionScore += 2;
        else if (avgResponseTime > 3000) suspicionScore += 1;
        
        // Look aways
        if (totalLookAways > 10) suspicionScore += 2;
        else if (totalLookAways > 5) suspicionScore += 1;
        
        // Convert to confidence score (0-100, higher is better)
        const confidenceScore = Math.max(0, Math.min(100, 100 - (suspicionScore * 10)));
        
        let verdict: 'confident' | 'mixed' | 'suspicious';
        if (confidenceScore >= 70) verdict = 'confident';
        else if (confidenceScore >= 40) verdict = 'mixed';
        else verdict = 'suspicious';
        
        set({
          behaviorMetrics: {
            avgGazeStability,
            avgBlinkRate,
            avgHeadMovement,
            avgResponseTime,
            totalLookAways,
            confidenceScore,
            verdict,
          }
        });
      },
      
      resetGame: () => set({
        stage: 'intro',
        calibrationData: {
          center: null,
          left: null,
          right: null,
          up: null,
          down: null,
        },
        currentCalibrationStep: null,
        questions: initialQuestions,
        currentQuestionIndex: 0,
        behaviorMetrics: null,
        isTracking: false,
        currentGazePosition: null,
        blinkCount: 0,
      }),
    }),
    {
      name: 'gazequest-storage',
      partialize: (state) => ({
        stage: state.stage,
        cameraPermission: state.cameraPermission,
        calibrationData: state.calibrationData,
        selectedCategory: state.selectedCategory,
        questions: state.questions,
        currentQuestionIndex: state.currentQuestionIndex,
        behaviorMetrics: state.behaviorMetrics,
      }),
    }
  )
);
