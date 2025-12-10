import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore, CalibrationDirection } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { CheckCircle2, UserCircle2, AlertTriangle } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useMediaPipeFaceMesh, EyeTrackingData } from '@/hooks/useMediaPipeFaceMesh';

const CALIBRATION_STEPS: { direction: CalibrationDirection; label: string; position: string }[] = [
  { direction: 'center', label: 'Look at the center', position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' },
  { direction: 'left', label: 'Look left', position: 'top-1/2 left-8 -translate-y-1/2' },
  { direction: 'right', label: 'Look right', position: 'top-1/2 right-8 -translate-y-1/2' },
  { direction: 'up', label: 'Look up', position: 'top-8 left-1/2 -translate-x-1/2' },
  { direction: 'down', label: 'Look down', position: 'bottom-8 left-1/2 -translate-x-1/2' },
];

export const CalibrationScreen = () => {
  const { videoRef } = useCamera();
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [countdown, setCountdown] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [showFaceWarning, setShowFaceWarning] = useState(false);
  const [isLookingAtTarget, setIsLookingAtTarget] = useState(false);
  const faceDetectedRef = useRef(false); // Use ref to avoid effect re-runs
  const trackingDataRef = useRef<EyeTrackingData | null>(null); // Store tracking data in ref to avoid effect re-runs
  const isLookingAtTargetRef = useRef(false); // Track if looking at correct position
  const navigate = useNavigate();
  const { setCalibrationData } = useGameStore();

  // Initialize MediaPipe FaceMesh for eye tracking - always enabled to show face detection status
  const { trackingData } = useMediaPipeFaceMesh({
    videoElement: videoRef.current,
    enabled: true, // Always enabled so face detection works before calibration starts
  });

  // Check if user is looking in the correct direction for the current step
  const checkGazeDirection = useCallback((direction: CalibrationDirection, gazeData: { x: number; y: number } | null): boolean => {
    if (!gazeData) return false;
    
    const CENTER_THRESHOLD = 0.3; // Tolerance for center
    const SIDE_THRESHOLD = 0.25; // Lower threshold for sides (more lenient)
    
    // Debug logging
    console.log(`Checking ${direction}: gazeX=${gazeData.x.toFixed(2)}, gazeY=${gazeData.y.toFixed(2)}`);
    
    switch (direction) {
      case 'center':
        // Looking at center: both x and y should be close to 0
        return Math.abs(gazeData.x) < CENTER_THRESHOLD && Math.abs(gazeData.y) < CENTER_THRESHOLD;
      case 'left':
        // Looking left: x should be negative (video is mirrored, so left = positive in camera space)
        // Using more lenient threshold
        return gazeData.x > SIDE_THRESHOLD;
      case 'right':
        // Looking right: x should be positive (video is mirrored, so right = negative in camera space)
        return gazeData.x < -SIDE_THRESHOLD;
      case 'up':
        // Looking up: y should be negative
        return gazeData.y < -SIDE_THRESHOLD;
      case 'down':
        // Looking down: y should be positive
        return gazeData.y > SIDE_THRESHOLD;
      default:
        return false;
    }
  }, []);

  // Monitor face detection status and gaze direction
  useEffect(() => {
    const hasFace = trackingData.leftIris !== null && trackingData.rightIris !== null;
    setFaceDetected(hasFace);
    faceDetectedRef.current = hasFace; // Keep ref updated
    trackingDataRef.current = trackingData; // Keep tracking data ref updated
    
    // Check if looking at the target for current step
    if (currentStepIndex >= 0 && currentStepIndex < CALIBRATION_STEPS.length) {
      const currentDirection = CALIBRATION_STEPS[currentStepIndex].direction;
      const lookingCorrectly = checkGazeDirection(currentDirection, trackingData.gazeDirection);
      setIsLookingAtTarget(lookingCorrectly);
      isLookingAtTargetRef.current = lookingCorrectly;
    }
    
    // Show warning if face is lost during calibration
    if (currentStepIndex >= 0 && !hasFace) {
      setShowFaceWarning(true);
    } else {
      setShowFaceWarning(false);
    }
  }, [trackingData, currentStepIndex, checkGazeDirection]);

  const startCalibration = useCallback(() => {
    setCurrentStepIndex(0);
  }, []);

  // Handle calibration steps - ONLY proceed when face is detected
  useEffect(() => {
    if (currentStepIndex < 0 || currentStepIndex >= CALIBRATION_STEPS.length) return;

    const step = CALIBRATION_STEPS[currentStepIndex];
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        // ONLY countdown if face is detected AND looking at the target
        if (!faceDetectedRef.current || !isLookingAtTargetRef.current) {
          return 3; // Reset to 3 if face not visible or not looking at target
        }
        
        if (prev <= 1) {
          clearInterval(countdownInterval);
          
          // Capture REAL iris position from MediaPipe - REQUIRED (use ref for latest data)
          const currentTrackingData = trackingDataRef.current;
          if (currentTrackingData?.leftIris && currentTrackingData?.rightIris) {
            const avgX = ((currentTrackingData.leftIris.x + currentTrackingData.rightIris.x) / 2) * 100;
            const avgY = ((currentTrackingData.leftIris.y + currentTrackingData.rightIris.y) / 2) * 100;
            
            setCalibrationData(step.direction, {
              x: avgX,
              y: avgY,
            });

            // Move to next step or complete
            setTimeout(() => {
              if (currentStepIndex < CALIBRATION_STEPS.length - 1) {
                setCurrentStepIndex(prev => prev + 1);
              } else {
                setIsComplete(true);
              }
            }, 300);
          } else {
            // Should not happen since we check faceDetected, but safety fallback
            console.error('Face lost at capture moment, retrying...');
            return 3; // Reset countdown to retry
          }

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

          {/* Face Detection Status Indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-sm border-2 transition-all duration-300" 
            style={{
              backgroundColor: faceDetected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              borderColor: faceDetected ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
            }}>
            {faceDetected ? (
              <>
                <UserCircle2 className="w-5 h-5 text-success" />
                <span className="text-xs font-semibold text-success">Face Detected</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
                <span className="text-xs font-semibold text-destructive">No Face Detected</span>
              </>
            )}
          </div>

          {/* Face Warning Overlay */}
          <AnimatePresence>
            {showFaceWarning && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center px-8">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2 text-destructive">Face Not Detected</h3>
                  <p className="text-muted-foreground mb-2">
                    Please position your face in the camera view
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Make sure you have good lighting and your face is visible
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  {/* Inner dot - changes color when looking correctly */}
                  <div 
                    className={`w-6 h-6 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 ${
                      isLookingAtTarget 
                        ? 'bg-success glow-success scale-110' 
                        : 'bg-primary glow-primary'
                    }`}
                  >
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
            <Button variant="success" size="lg" onClick={() => navigate('/category')}>
              Choose Category
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
