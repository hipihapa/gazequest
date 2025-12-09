import { useEffect, useState, useRef } from 'react';

export interface BrightnessData {
  brightness: number; // 0-100
  isAcceptable: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface UseBrightnessDetectionProps {
  videoElement: HTMLVideoElement | null;
  enabled?: boolean;
  minAcceptableBrightness?: number; // Default 30
}

export const useBrightnessDetection = ({
  videoElement,
  enabled = true,
  minAcceptableBrightness = 30,
}: UseBrightnessDetectionProps) => {
  const [brightnessData, setBrightnessData] = useState<BrightnessData>({
    brightness: 0,
    isAcceptable: false,
    quality: 'poor',
  });
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!videoElement || !enabled) return;

    // Create offscreen canvas for brightness analysis
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      contextRef.current = canvasRef.current.getContext('2d', { willReadFrequently: true });
    }

    const canvas = canvasRef.current;
    const context = contextRef.current;
    
    if (!context) return;

    const analyzeBrightness = () => {
      if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(analyzeBrightness);
        return;
      }

      // Set canvas size (small for performance)
      const scale = 0.25; // Analyze at 25% resolution
      canvas.width = videoElement.videoWidth * scale;
      canvas.height = videoElement.videoHeight * scale;

      // Draw current video frame
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calculate average brightness
      let totalBrightness = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Calculate perceived brightness using luminance formula
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;
      }

      const avgBrightness = totalBrightness / pixelCount;
      const normalizedBrightness = Math.round((avgBrightness / 255) * 100);

      // Determine quality level
      let quality: 'excellent' | 'good' | 'fair' | 'poor';
      if (normalizedBrightness >= 60) quality = 'excellent';
      else if (normalizedBrightness >= 45) quality = 'good';
      else if (normalizedBrightness >= 30) quality = 'fair';
      else quality = 'poor';

      setBrightnessData({
        brightness: normalizedBrightness,
        isAcceptable: normalizedBrightness >= minAcceptableBrightness,
        quality,
      });

      // Continue analyzing (check every 500ms for performance)
      setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(analyzeBrightness);
      }, 500);
    };

    analyzeBrightness();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoElement, enabled, minAcceptableBrightness]);

  return brightnessData;
};
