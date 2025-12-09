import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

// MediaPipe FaceMesh landmark indices
const LANDMARKS = {
  // Right eye indices
  RIGHT_EYE: [33, 133, 160, 159, 158, 144, 145, 153],
  RIGHT_IRIS: [469, 470, 471, 472], // Right iris landmarks
  
  // Left eye indices  
  LEFT_EYE: [362, 263, 387, 386, 385, 380, 374, 373],
  LEFT_IRIS: [474, 475, 476, 477], // Left iris landmarks
  
  // Face outline for head movement detection
  FACE_OVAL: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288],
};

export interface EyeTrackingData {
  leftIris: { x: number; y: number } | null;
  rightIris: { x: number; y: number } | null;
  isBlinking: boolean;
  gazeDirection: { x: number; y: number } | null; // Normalized -1 to 1
  facePosition: { x: number; y: number; z: number } | null;
  isLookingAway: boolean;
  trackingQuality: 'excellent' | 'good' | 'fair' | 'poor';
  confidenceScore: number; // 0-100
}

export interface UseMediaPipeFaceMeshProps {
  videoElement: HTMLVideoElement | null;
  enabled?: boolean;
  onResults?: (data: EyeTrackingData) => void;
}

export const useMediaPipeFaceMesh = ({ 
  videoElement, 
  enabled = true,
  onResults 
}: UseMediaPipeFaceMeshProps) => {
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [trackingData, setTrackingData] = useState<EyeTrackingData>({
    leftIris: null,
    rightIris: null,
    isBlinking: false,
    gazeDirection: null,
    facePosition: null,
    isLookingAway: false,
    trackingQuality: 'poor',
    confidenceScore: 0,
  });
  const previousEyeAspectRatio = useRef<number>(0);

  // Calculate Eye Aspect Ratio (EAR) for blink detection
  const calculateEAR = useCallback((eyeLandmarks: Array<{ x: number; y: number; z?: number }>) => {
    if (eyeLandmarks.length < 6) return 0;
    
    // Vertical distances
    const v1 = Math.hypot(
      eyeLandmarks[1].x - eyeLandmarks[5].x,
      eyeLandmarks[1].y - eyeLandmarks[5].y
    );
    const v2 = Math.hypot(
      eyeLandmarks[2].x - eyeLandmarks[4].x,
      eyeLandmarks[2].y - eyeLandmarks[4].y
    );
    
    // Horizontal distance
    const h = Math.hypot(
      eyeLandmarks[0].x - eyeLandmarks[3].x,
      eyeLandmarks[0].y - eyeLandmarks[3].y
    );
    
    return (v1 + v2) / (2.0 * h);
  }, []);

  // Process MediaPipe results
  const processResults = useCallback((results: Results) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setTrackingData({
        leftIris: null,
        rightIris: null,
        isBlinking: false,
        gazeDirection: null,
        facePosition: null,
        isLookingAway: true,
        trackingQuality: 'poor',
        confidenceScore: 0,
      });
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];

    // Get iris positions (normalized 0-1)
    const leftIrisLandmarks = LANDMARKS.LEFT_IRIS.map(i => landmarks[i]);
    const rightIrisLandmarks = LANDMARKS.RIGHT_IRIS.map(i => landmarks[i]);
    
    const leftIris = leftIrisLandmarks[0]; // Center of left iris
    const rightIris = rightIrisLandmarks[0]; // Center of right iris

    // Get eye landmarks for blink detection
    const leftEyeLandmarks = LANDMARKS.LEFT_EYE.map(i => landmarks[i]);
    const rightEyeLandmarks = LANDMARKS.RIGHT_EYE.map(i => landmarks[i]);
    
    const leftEAR = calculateEAR(leftEyeLandmarks);
    const rightEAR = calculateEAR(rightEyeLandmarks);
    const avgEAR = (leftEAR + rightEAR) / 2;
    
    // Blink detection: EAR drops below threshold
    const EAR_THRESHOLD = 0.2;
    const isBlinking = avgEAR < EAR_THRESHOLD;

    // Calculate gaze direction (simplified - uses iris position relative to eye corners)
    const gazeX = ((leftIris.x + rightIris.x) / 2 - 0.5) * 2; // Normalize to -1 to 1
    const gazeY = ((leftIris.y + rightIris.y) / 2 - 0.5) * 2;

    // Get face position (using nose tip as reference)
    const noseTip = landmarks[1];
    const facePosition = {
      x: noseTip.x,
      y: noseTip.y,
      z: noseTip.z || 0,
    };

    // Detect if looking away (face turned significantly)
    const isLookingAway = Math.abs(gazeX) > 0.7 || Math.abs(gazeY) > 0.7;

    // Calculate tracking quality based on landmark stability and detection
    // Higher z-variance indicates less stable tracking
    const landmarkVariance = leftIrisLandmarks.reduce((acc, landmark) => {
      return acc + Math.abs(landmark.z || 0);
    }, 0) / leftIrisLandmarks.length;
    
    // Normalize confidence (lower variance = higher confidence)
    const confidenceScore = Math.max(0, Math.min(100, 100 - (landmarkVariance * 1000)));
    
    // Determine tracking quality
    let trackingQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (confidenceScore >= 80) trackingQuality = 'excellent';
    else if (confidenceScore >= 60) trackingQuality = 'good';
    else if (confidenceScore >= 40) trackingQuality = 'fair';
    else trackingQuality = 'poor';

    const data: EyeTrackingData = {
      leftIris: { x: leftIris.x, y: leftIris.y },
      rightIris: { x: rightIris.x, y: rightIris.y },
      isBlinking,
      gazeDirection: { x: gazeX, y: gazeY },
      facePosition,
      isLookingAway,
      trackingQuality,
      confidenceScore: Math.round(confidenceScore),
    };

    setTrackingData(data);
    previousEyeAspectRatio.current = avgEAR;
    
    if (onResults) {
      onResults(data);
    }
  }, [calculateEAR, onResults]);

  // Initialize MediaPipe FaceMesh
  useEffect(() => {
    if (!videoElement || !enabled) return;

    const initFaceMesh = async () => {
      try {
        // Initialize FaceMesh
        const faceMesh = new FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          },
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true, // Enable iris tracking
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(processResults);

        // Initialize camera
        const camera = new Camera(videoElement, {
          onFrame: async () => {
            if (videoElement && faceMeshRef.current) {
              await faceMeshRef.current.send({ image: videoElement });
            }
          },
          width: 640,
          height: 480,
        });

        faceMeshRef.current = faceMesh;
        cameraRef.current = camera;

        await camera.start();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize MediaPipe FaceMesh:', error);
      }
    };

    initFaceMesh();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, [videoElement, enabled, processResults]);

  return {
    isInitialized,
    trackingData,
  };
};
