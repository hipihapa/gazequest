import { useState, useEffect, useCallback, useRef } from 'react';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface UseSpeechRecognitionProps {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

export const useSpeechRecognition = ({ onResult, onError }: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    console.log('SpeechRecognition API available:', !!SpeechRecognitionAPI);
    setIsSupported(!!SpeechRecognitionAPI);

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true; // Enable interim results to see progress
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started');
      };

      recognition.onaudiostart = () => {
        console.log('Audio capture started');
      };

      recognition.onspeechstart = () => {
        console.log('Speech detected');
      };

      recognition.onspeechend = () => {
        console.log('Speech ended');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('Speech recognition result event:', event);
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          const transcript = result[0].transcript.toLowerCase().trim();
          console.log('Final speech recognized:', transcript);
          onResultRef.current(transcript);
          setIsListening(false);
        } else {
          console.log('Interim result:', result[0].transcript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event.message);
        onErrorRef.current?.(event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []); // Empty dependency array - only run once

  const startListening = useCallback(() => {
    console.log('startListening called, recognition:', !!recognitionRef.current, 'isListening:', isListening);
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('Recognition started successfully');
      } catch (error) {
        console.error('Failed to start recognition:', error);
        // If already started, stop and restart
        if (error instanceof Error && error.message.includes('already started')) {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current?.start();
            setIsListening(true);
          }, 100);
        }
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    console.log('stopListening called');
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
};
