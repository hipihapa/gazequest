import { useEffect, useRef, useState } from 'react';

let sharedStream: MediaStream | null = null;
let streamRefCount = 0;

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        // If we don't have a shared stream yet, create one
        if (!sharedStream) {
          sharedStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user', 
              width: { ideal: 640 }, 
              height: { ideal: 480 } 
            }
          });
        }

        // Increment reference count
        streamRefCount++;

        // Attach stream to video element
        if (videoRef.current && mounted) {
          videoRef.current.srcObject = sharedStream;
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('Failed to start camera:', err);
        setError('Camera access denied');
      }
    };

    initCamera();

    return () => {
      mounted = false;
      
      // Decrement reference count
      streamRefCount--;

      // Only stop the stream if no components are using it
      if (streamRefCount === 0 && sharedStream) {
        sharedStream.getTracks().forEach(track => track.stop());
        sharedStream = null;
      }
    };
  }, []);

  return { videoRef, isInitialized, error };
};

// Helper function to manually stop the camera (e.g., when leaving the game)
export const stopSharedCamera = () => {
  if (sharedStream) {
    sharedStream.getTracks().forEach(track => track.stop());
    sharedStream = null;
    streamRefCount = 0;
  }
};
