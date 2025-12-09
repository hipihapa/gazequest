import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useToast } from '@/hooks/use-toast';

export const QuestionScreen = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const questionStartTime = useRef<number>(0);
  const trackingInterval = useRef<number | null>(null);
  const { toast } = useToast();
  
  const { 
    questions, 
    currentQuestionIndex, 
    updateQuestionData,
    nextQuestion,
    setStage,
    calculateResults 
  } = useGameStore();

  const [showingQuestion, setShowingQuestion] = useState(true);
  const [localBlinkCount, setLocalBlinkCount] = useState(0);
  const [localLookAways, setLocalLookAways] = useState(0);
  const [gazeStability, setGazeStability] = useState(100);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / questions.length) * 100;

  const handleAnswer = useCallback((answer: string) => {
    const responseTime = Date.now() - questionStartTime.current;
    
    // Stop tracking
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
    }

    // Calculate metrics for this question
    const headMovement = Math.random() * 40; // Simulated
    const blinkRate = localBlinkCount * (60000 / responseTime); // Blinks per minute

    // Update question data
    updateQuestionData(currentQuestionIndex, {
      answer,
      responseTime,
      gazeStability,
      blinkRate,
      headMovement,
      lookAwayCount: localLookAways,
    });

    // Show transition then move to next
    setShowingQuestion(false);
    setVoiceTranscript(null);
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        calculateResults();
        setStage('results');
      }
    }, 500);
  }, [
    currentQuestionIndex, 
    localBlinkCount, 
    localLookAways, 
    gazeStability, 
    questions.length,
    updateQuestionData,
    nextQuestion,
    calculateResults,
    setStage
  ]);

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

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 240 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Failed to start camera:', err);
      }
    };
    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Simulate tracking behavior for each question
  useEffect(() => {
    questionStartTime.current = Date.now();
    setLocalBlinkCount(0);
    setLocalLookAways(0);
    setGazeStability(100);
    setShowingQuestion(true);
    setVoiceTranscript(null);

    // Simulate eye tracking behavior
    trackingInterval.current = window.setInterval(() => {
      // Simulate random behavior detection
      if (Math.random() > 0.85) {
        setLocalBlinkCount(prev => prev + 1);
      }
      if (Math.random() > 0.9) {
        setLocalLookAways(prev => prev + 1);
        setGazeStability(prev => Math.max(50, prev - 5));
      }
    }, 500);

    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
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
          {/* Camera feed (small) */}
          <motion.div 
            className="relative w-32 h-24 mx-auto mb-8 rounded-lg overflow-hidden border border-primary/30"
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
            <div className="absolute top-1 right-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-success font-medium">TRACKING</span>
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
                      onClick={isListening ? stopListening : startListening}
                      className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 mx-auto ${
                        isListening 
                          ? 'bg-suspicious/20 border-2 border-suspicious glow-suspicious' 
                          : 'bg-primary/20 border-2 border-primary/50 hover:border-primary glow-primary'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isListening ? (
                        <>
                          <motion.div
                            className="absolute inset-0 rounded-full bg-suspicious/30"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <MicOff className="w-8 h-8 text-suspicious" />
                        </>
                      ) : (
                        <Mic className="w-8 h-8 text-primary" />
                      )}
                    </motion.button>
                    <p className="text-sm text-muted-foreground mt-3">
                      {isListening ? 'Listening... say Yes or No' : 'Tap to speak your answer'}
                    </p>
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
    </motion.div>
  );
};
