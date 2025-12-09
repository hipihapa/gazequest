import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, CalibrationDirection } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const CALIBRATION_STEPS: { direction: CalibrationDirection; label: string; position: string }[] = [
  { direction: 'center', label: 'Look at the center', position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' },
  { direction: 'left', label: 'Look left', position: 'top-1/2 left-8 -translate-y-1/2' },
  { direction: 'right', label: 'Look right', position: 'top-1/2 right-8 -translate-y-1/2' },
  { direction: 'up', label: 'Look up', position: 'top-8 left-1/2 -translate-x-1/2' },
  { direction: 'down', label: 'Look down', position: 'bottom-8 left-1/2 -translate-x-1/2' },
];

export const CalibrationScreen = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [countdown, setCountdown] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { setCalibrationData, setStage } = useGameStore();

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
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

  const startCalibration = useCallback(() => {
    setCurrentStepIndex(0);
  }, []);

  // Handle calibration steps
  useEffect(() => {
    if (currentStepIndex < 0 || currentStepIndex >= CALIBRATION_STEPS.length) return;

    const step = CALIBRATION_STEPS[currentStepIndex];
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          
          // Simulate capturing calibration data
          // In a real implementation, we'd get actual iris position from MediaPipe
          setCalibrationData(step.direction, {
            x: Math.random() * 100,
            y: Math.random() * 100,
          });

          // Move to next step or complete
          setTimeout(() => {
            if (currentStepIndex < CALIBRATION_STEPS.length - 1) {
              setCurrentStepIndex(prev => prev + 1);
            } else {
              setIsComplete(true);
            }
          }, 300);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [currentStepIndex, setCalibrationData]);

  const currentStep = currentStepIndex >= 0 ? CALIBRATION_STEPS[currentStepIndex] : null;

  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-4xl">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
            {isComplete ? 'Calibration Complete!' : 'Eye Calibration'}
          </h2>
          <p className="text-muted-foreground">
            {isComplete 
              ? 'Great job! Your eyes are now calibrated.' 
              : currentStepIndex < 0 
                ? 'Follow the dot with your eyes to calibrate tracking'
                : currentStep?.label
            }
          </p>
        </motion.div>

        {/* Camera and calibration area */}
        <div className="relative aspect-video max-w-2xl mx-auto rounded-2xl overflow-hidden border-glow bg-card">
          {/* Video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />

          {/* Calibration dots */}
          <AnimatePresence mode="wait">
            {currentStep && !isComplete && (
              <motion.div
                key={currentStep.direction}
                className={`absolute ${currentStep.position}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <div className="relative">
                  {/* Outer pulsing ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ width: 48, height: 48, marginLeft: -24, marginTop: -24 }}
                  />
                  {/* Inner dot */}
                  <div className="w-6 h-6 rounded-full bg-primary glow-primary -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    {countdown > 0 && (
                      <span className="text-xs font-bold text-primary-foreground">{countdown}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Complete indicator */}
          {isComplete && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-background/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                <CheckCircle2 className="w-24 h-24 text-success" />
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mt-6 mb-8">
          {CALIBRATION_STEPS.map((step, index) => (
            <motion.div
              key={step.direction}
              className={`w-3 h-3 rounded-full transition-colors ${
                index < currentStepIndex || isComplete
                  ? 'bg-success'
                  : index === currentStepIndex
                    ? 'bg-primary animate-pulse'
                    : 'bg-muted'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            />
          ))}
        </div>

        {/* Action button */}
        <div className="flex justify-center">
          {currentStepIndex < 0 ? (
            <Button variant="hero" size="lg" onClick={startCalibration}>
              Start Calibration
            </Button>
          ) : isComplete ? (
            <Button variant="success" size="lg" onClick={() => setStage('questions')}>
              Begin Game
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {CALIBRATION_STEPS.length}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
