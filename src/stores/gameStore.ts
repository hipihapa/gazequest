import { create } from 'zustand';

export type GameStage = 'intro' | 'permission' | 'calibration' | 'questions' | 'results';

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
  updateQuestionData: (index: number, data: Partial<QuestionData>) => void;
  nextQuestion: () => void;
  setCurrentGazePosition: (pos: { x: number; y: number } | null) => void;
  incrementBlinkCount: () => void;
  setIsTracking: (tracking: boolean) => void;
  calculateResults: () => void;
  resetGame: () => void;
}

const questions: Omit<QuestionData, 'answer' | 'responseTime' | 'gazeStability' | 'blinkRate' | 'headMovement' | 'lookAwayCount'>[] = [
  { id: 1, text: "Do you like pineapple on pizza?" },
  { id: 2, text: "Have you ever lied about finishing homework?" },
  { id: 3, text: "Would you eat Jollof rice every day?" },
  { id: 4, text: "Have you ever pretended to be sick to skip work?" },
  { id: 5, text: "Do you think you're a good liar?" },
];

const initialQuestions: QuestionData[] = questions.map(q => ({
  ...q,
  answer: null,
  responseTime: 0,
  gazeStability: 100,
  blinkRate: 0,
  headMovement: 0,
  lookAwayCount: 0,
}));

export const useGameStore = create<GameState>((set, get) => ({
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
}));
