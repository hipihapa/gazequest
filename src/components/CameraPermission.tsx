import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';

export const CameraPermission = () => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setCameraPermission } = useGameStore();

  const requestPermission = async () => {
    setIsRequesting(true);
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      // Stop the stream for now, we'll start it again in calibration
      stream.getTracks().forEach(track => track.stop());
      
      setCameraPermission(true);
      navigate('/calibration');
    } catch (err) {
      console.error('Camera permission denied:', err);
      setError('Camera access is required to play. Please allow camera access and try again.');
      setCameraPermission(false);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Camera icon with animation */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring" }}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
          <motion.div 
            className="relative w-24 h-24 rounded-full border-2 border-primary/50 flex items-center justify-center bg-card"
            animate={isRequesting ? { 
              boxShadow: [
                "0 0 20px hsl(187 100% 50% / 0.3)",
                "0 0 40px hsl(187 100% 50% / 0.6)",
                "0 0 20px hsl(187 100% 50% / 0.3)"
              ]
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {isRequesting ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            ) : error ? (
              <AlertCircle className="w-12 h-12 text-destructive" />
            ) : (
              <Camera className="w-12 h-12 text-primary" />
            )}
          </motion.div>
        </div>
      </motion.div>

      <motion.h2
        className="text-2xl md:text-3xl font-display font-bold mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {error ? 'Camera Access Denied' : 'Enable Camera Access'}
      </motion.h2>

      <motion.p
        className="text-muted-foreground mb-8 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {error ? error : 'We need access to your camera to track your eye movements during the game.'}
      </motion.p>

      {error ? (
        <motion.div
          className="glass-card rounded-xl p-4 mb-8 max-w-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Check your browser settings and make sure camera access is allowed for this site.
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="flex items-center gap-2 text-success mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm">100% private - no data leaves your device</span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button 
          variant={error ? "outline" : "hero"}
          size="lg"
          onClick={requestPermission}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Requesting Access...
            </>
          ) : error ? (
            'Try Again'
          ) : (
            'Allow Camera Access'
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};
