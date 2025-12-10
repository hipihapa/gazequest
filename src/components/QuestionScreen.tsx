import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useToast } from '@/hooks/use-toast';
import { useCamera } from '@/hooks/useCamera';
import { useMediaPipeFaceMesh, EyeTrackingData } from '@/hooks/useMediaPipeFaceMesh';
import { FeedbackCard } from '@/components/FeedbackCard';

export const QuestionScreen = () => {
  const { videoRef } = useCamera();
  const questionStartTime = useRef<number>(0);
  const previousGazePosition = useRef<{ x: number; y: number } | null>(null);
  const gazeStabilityHistory = useRef<number[]>([]);
  const trackingFramesReceived = useRef<number>(0); // Track number of successful tracking frames
  const trackingDataRef = useRef<EyeTrackingData | null>(null); // Store tracking data in ref like CalibrationScreen
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { 
    questions, 
    currentQuestionIndex, 
    updateQuestionData,
    nextQuestion,
    calculateResults 
  } = useGameStore();

  const [showingQuestion, setShowingQuestion] = useState(true);
  const [localBlinkCount, setLocalBlinkCount] = useState(0);
  const [localLookAways, setLocalLookAways] = useState(0);
  const [gazeStability, setGazeStability] = useState(100);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true); // Default muted
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackVerdict, setFeedbackVerdict] = useState<'truthful' | 'suspicious'>('truthful');
  const [feedbackConfidence, setFeedbackConfidence] = useState(0);
  const [trackingQualityData, setTrackingQualityData] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / questions.length) * 100;

  // Initialize MediaPipe FaceMesh - like CalibrationScreen, get trackingData directly
  const { trackingData } = useMediaPipeFaceMesh({
    videoElement: videoRef.current,
    enabled: showingQuestion,
  });

  // Monitor tracking data changes - like CalibrationScreen pattern
  useEffect(() => {
    // Check if face is detected (same logic as CalibrationScreen)
    const hasFace = trackingData.leftIris !== null && trackingData.rightIris !== null;
    setIsFaceDetected(hasFace);
    trackingDataRef.current = trackingData; // Keep ref updated for use in callbacks
    
    // Only process tracking when face is detected
    if (!hasFace) return;
    
    // Increment tracking frames counter
    trackingFramesReceived.current += 1;
    
    // Update tracking quality
    setTrackingQualityData(trackingData.trackingQuality);
    
    // Track blinks
    if (trackingData.isBlinking) {
      setLocalBlinkCount(prev => prev + 1);
    }

    // Track look aways
    if (trackingData.isLookingAway) {
      setLocalLookAways(prev => prev + 1);
    }

    // Calculate gaze stability based on movement
    if (trackingData.gazeDirection && previousGazePosition.current) {
      const movement = Math.hypot(
        trackingData.gazeDirection.x - previousGazePosition.current.x,
        trackingData.gazeDirection.y - previousGazePosition.current.y
      );
      
      gazeStabilityHistory.current.push(movement);
      if (gazeStabilityHistory.current.length > 10) {
        gazeStabilityHistory.current.shift();
      }
      
      // Calculate stability score (lower movement = higher stability)
      const avgMovement = gazeStabilityHistory.current.reduce((a, b) => a + b, 0) / gazeStabilityHistory.current.length;
      const stabilityScore = Math.max(0, Math.min(100, 100 - (avgMovement * 200)));
      setGazeStability(Math.round(stabilityScore));
    }
    
    if (trackingData.gazeDirection) {
      previousGazePosition.current = trackingData.gazeDirection;
    }
  }, [trackingData]); // Re-run when trackingData changes

  const handleAnswer = useCallback((answer: string) => {
    const responseTime = Date.now() - questionStartTime.current;
    
    // VALIDATION 1: Check if face is currently detected
    if (!isFaceDetected) {
      toast({
        title: "👀 Look at the Camera",
        description: "Please ensure your face is visible in the camera before answering. We need to track your eye movements.",
        variant: "destructive",
        duration: 5000,
      });
      return; // Don't process the answer
    }
    
    // VALIDATION 2: Check if we received sufficient tracking data during the question
    // Minimum 10 frames required (about 0.3 seconds at 30fps)
    const MIN_TRACKING_FRAMES = 10;
    const hasValidTracking = trackingFramesReceived.current >= MIN_TRACKING_FRAMES;
    
    console.log('📊 Tracking Validation:', {
      faceCurrentlyDetected: isFaceDetected,
      framesReceived: trackingFramesReceived.current,
      minimumRequired: MIN_TRACKING_FRAMES,
      hasValidTracking,
      responseTime
    });
    
    // If insufficient tracking, show warning and don't proceed
    if (!hasValidTracking) {
      toast({
        title: "⚠️ Eye Tracking Failed",
        description: `Only ${trackingFramesReceived.current} tracking frames received (need ${MIN_TRACKING_FRAMES}). Camera may be covered or face not detected.`,
        variant: "destructive",
        duration: 5000,
      });
      return; // Don't process the answer
    }

    // Calculate metrics for this question
    const headMovement = localLookAways * 5; // Simple estimation
    const blinkRate = localBlinkCount * (60000 / responseTime); // Blinks per minute

    // Calculate lie detection verdict for this question - more nuanced scoring
    let truthfulnessScore = 100; // Start with perfect score
    
    // Gaze stability (lower stability = more suspicious)
    // More gradual scoring system
    if (gazeStability < 50) {
      truthfulnessScore -= 25;
    } else if (gazeStability < 65) {
      truthfulnessScore -= 15;
    } else if (gazeStability < 75) {
      truthfulnessScore -= 10;
    } else if (gazeStability < 85) {
      truthfulnessScore -= 5;
    }
    
    // Blink rate (higher = more nervous, but also too low can be suspicious)
    if (blinkRate > 30) {
      truthfulnessScore -= 20;
    } else if (blinkRate > 20) {
      truthfulnessScore -= 12;
    } else if (blinkRate > 15) {
      truthfulnessScore -= 8;
    } else if (blinkRate < 3 && responseTime > 1000) {
      // Too few blinks can also be suspicious (trying too hard)
      truthfulnessScore -= 5;
    }
    
    // Head movement (higher = more avoidance)
    if (headMovement > 25) {
      truthfulnessScore -= 15;
    } else if (headMovement > 15) {
      truthfulnessScore -= 10;
    } else if (headMovement > 8) {
      truthfulnessScore -= 5;
    }
    
    // Response time (both too quick and too slow can be suspicious)
    if (responseTime > 7000) {
      truthfulnessScore -= 18; // Very slow = thinking/lying
    } else if (responseTime > 5000) {
      truthfulnessScore -= 12;
    } else if (responseTime > 3500) {
      truthfulnessScore -= 6;
    } else if (responseTime < 800) {
      truthfulnessScore -= 8; // Too quick = rehearsed
    }
    
    // Look aways (direct correlation with suspicion)
    if (localLookAways > 3) {
      truthfulnessScore -= 20;
    } else if (localLookAways > 2) {
      truthfulnessScore -= 12;
    } else if (localLookAways > 1) {
      truthfulnessScore -= 8;
    } else if (localLookAways > 0) {
      truthfulnessScore -= 4;
    }
    
    // Add natural variation (±5%) to make it feel more realistic
    const variation = Math.random() * 10 - 5;
    truthfulnessScore += variation;
    
    // Clamp to 0-100 range
    const verdictConfidence = Math.max(15, Math.min(100, Math.round(truthfulnessScore)));
    const verdict: 'truthful' | 'suspicious' = verdictConfidence >= 50 ? 'truthful' : 'suspicious';
    
    // Debug logging to understand the calculation
    console.log('🎯 Confidence Calculation:', {
      gazeStability,
      blinkRate: Math.round(blinkRate),
      headMovement,
      responseTime,
      lookAways: localLookAways,
      finalConfidence: verdictConfidence,
      verdict
    });

    // Update question data
    updateQuestionData(currentQuestionIndex, {
      answer,
      responseTime,
      gazeStability,
      blinkRate,
      headMovement,
      lookAwayCount: localLookAways,
      verdict,
      verdictConfidence,
      trackingQuality: trackingQualityData,
    });

    // Show feedback card
    setFeedbackVerdict(verdict);
    setFeedbackConfidence(verdictConfidence);
    setShowingQuestion(false);
    setShowFeedback(true);
    setVoiceTranscript(null);
  }, [
    currentQuestionIndex, 
    localBlinkCount, 
    localLookAways, 
    gazeStability, 
    trackingQualityData,
    updateQuestionData,
    toast,
    isFaceDetected,
  ]);

  // Handle feedback completion
  const handleFeedbackComplete = useCallback(() => {
    setShowFeedback(false);
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        calculateResults();
        navigate('/results');
      }
    }, 300);
  }, [currentQuestionIndex, questions.length, nextQuestion, calculateResults, navigate]);

  // Process voice input
  const processVoiceInput = useCallback((transcript: string) => {
    setVoiceTranscript(transcript);
    
    const lowerTranscript = transcript.toLowerCase();
    
    // Check for yes/no variations
    const yesPatterns = ['yes', 'yeah', 'yep', 'yup', 'sure', 'absolutely', 'definitely', 'of course', 'affirmative', 'correct', 'right', 'true', 'i do', 'i did', 'i have', 'i would'];
    const noPatterns = ['no', 'nope', 'nah', 'never', 'not', 'negative', 'false', 'wrong', 'i don\'t', 'i didn\'t', 'i haven\'t', 'i wouldn\'t'];
    
    const isYes = yesPatterns.some(pattern => lowerTranscript.includes(pattern));
    const isNo = noPatterns.some(pattern => lowerTranscript.includes(pattern));
    
    if (isYes && !isNo) {
      setTimeout(() => handleAnswer('yes'), 500);
    } else if (isNo && !isYes) {
      setTimeout(() => handleAnswer('no'), 500);
    } else {
      toast({
        title: "Couldn't understand",
        description: "Please say 'Yes' or 'No' clearly",
        variant: "destructive",
      });
    }
  }, [handleAnswer, toast]);

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition({
    onResult: processVoiceInput,
    onError: (error) => {
      toast({
        title: "Voice recognition error",
        description: error === 'not-allowed' ? 'Microphone access denied' : 'Please try again',
        variant: "destructive",
      });
    },
  });

  // Spacebar push-to-talk functionality
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if spacebar already pressed or if target is an input/textarea
      if (e.code === 'Space' && !isSpacebarPressed) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') {
          return;
        }
        
        e.preventDefault();
        setIsSpacebarPressed(true);
        
        // Start listening when spacebar is pressed (regardless of mute state)
        if (!isListening) {
          startListening();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isSpacebarPressed) {
        e.preventDefault();
        setIsSpacebarPressed(false);
        
        // Stop listening when spacebar is released
        if (isListening) {
          stopListening();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacebarPressed, isListening, startListening, stopListening]);

  // Handle microphone button click (toggle persistent mute)
  const handleMicToggle = useCallback(() => {
    if (isMuted) {
      // Unmute and start listening
      setIsMuted(false);
      if (!isListening) {
        startListening();
      }
    } else {
      // Mute and stop listening
      setIsMuted(true);
      if (isListening) {
        stopListening();
      }
    }
  }, [isMuted, isListening, startListening, stopListening]);

  // Auto-stop listening when unmuted via toggle and speech ends
  useEffect(() => {
    // If not muted via toggle and not listening anymore, don't restart automatically
    // Only spacebar should trigger temporary listening
    if (!isMuted && !isListening && !isSpacebarPressed) {
      // User finished speaking, keep unmuted but not actively listening
      // They can click the button or press spacebar again
    }
  }, [isMuted, isListening, isSpacebarPressed]);

  // Reset tracking data for each question and ensure muted state
  useEffect(() => {
    questionStartTime.current = Date.now();
    trackingFramesReceived.current = 0; // Reset tracking frames counter
    setLocalBlinkCount(0);
    setLocalLookAways(0);
    setGazeStability(100);
    setShowingQuestion(true);
    setVoiceTranscript(null);
    setIsMuted(true); // Always start muted
    setIsSpacebarPressed(false);
    previousGazePosition.current = null;
    gazeStabilityHistory.current = [];
    
    // Stop any active listening when moving to new question
    if (isListening) {
      stopListening();
    }
  }, [currentQuestionIndex]);

  return (
    <motion.div 
      className="flex flex-col min-h-screen px-6 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header with progress */}
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Camera feed (larger for better tracking) */}
          <motion.div 
            className="relative w-64 h-48 mx-auto mb-8 rounded-lg overflow-hidden border border-primary/30"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className={`absolute top-1 right-1 flex items-center gap-1 px-2 py-0.5 rounded-full ${
              isFaceDetected ? 'bg-success/20' : 'bg-destructive/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                isFaceDetected ? 'bg-success animate-pulse' : 'bg-destructive'
              }`} />
              <span className={`text-[10px] font-medium ${
                isFaceDetected ? 'text-success' : 'text-destructive'
              }`}>
                {isFaceDetected ? 'TRACKING' : 'NO FACE'}
              </span>
            </div>
          </motion.div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            {showingQuestion && currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                className="glass-card rounded-2xl p-8 mb-8 text-center border-glow"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-primary" />
                  <span className="text-sm text-primary font-medium">We're watching your eyes...</span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-8">
                  {currentQuestion.text}
                </h3>

                {/* Voice transcript feedback */}
                {voiceTranscript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30"
                  >
                    <span className="text-sm text-muted-foreground">You said: </span>
                    <span className="text-primary font-medium">"{voiceTranscript}"</span>
                  </motion.div>
                )}

                {/* Voice input button */}
                {isSupported && (
                  <div className="mb-6">
                    <motion.button
                      onClick={handleMicToggle}
                      className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 mx-auto ${
                        isListening 
                          ? 'bg-success/20 border-2 border-success glow-success' 
                          : isMuted
                          ? 'bg-muted/20 border-2 border-muted/50 hover:border-muted'
                          : 'bg-primary/20 border-2 border-primary/50 hover:border-primary glow-primary'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isListening ? (
                        <>
                          <motion.div
                            className="absolute inset-0 rounded-full bg-success/30"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <Mic className="w-8 h-8 text-success" />
                        </>
                      ) : isMuted ? (
                        <MicOff className="w-8 h-8 text-muted-foreground" />
                      ) : (
                        <Mic className="w-8 h-8 text-primary" />
                      )}
                    </motion.button>
                    <p className="text-sm text-muted-foreground mt-3">
                      {isListening 
                        ? 'Listening... say Yes or No' 
                        : isMuted 
                        ? 'Click to unmute or hold SPACE to talk'
                        : 'Click to start listening'
                      }
                    </p>
                    {isSpacebarPressed && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-xs text-success font-medium"
                      >
                        🎤 Spacebar held - Recording...
                      </motion.div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 justify-center mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">or tap</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Answer buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="answer"
                    size="lg"
                    className="min-w-[120px]"
                    onClick={() => handleAnswer('yes')}
                    disabled={isListening}
                  >
                    Yes
                  </Button>
                  <Button
                    variant="answer"
                    size="lg"
                    className="min-w-[120px]"
                    onClick={() => handleAnswer('no')}
                    disabled={isListening}
                  >
                    No
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live metrics (subtle) */}
          <motion.div 
            className="flex justify-center gap-8 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${gazeStability > 80 ? 'bg-success' : gazeStability > 60 ? 'bg-warning' : 'bg-suspicious'}`} />
              <span>Gaze: {gazeStability}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${localBlinkCount < 3 ? 'bg-success' : localBlinkCount < 6 ? 'bg-warning' : 'bg-suspicious'}`} />
              <span>Blinks: {localBlinkCount}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Feedback Card */}
      <AnimatePresence>
        {showFeedback && (
          <FeedbackCard
            verdict={feedbackVerdict}
            confidence={feedbackConfidence}
            onComplete={handleFeedbackComplete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
