import { motion } from 'framer-motion';
import { Eye, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/stores/gameStore';

export const IntroScreen = () => {
  const setStage = useGameStore((state) => state.setStage);

  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Logo/Icon */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
          <div className="relative w-32 h-32 rounded-full border-glow flex items-center justify-center bg-card">
            <Eye className="w-16 h-16 text-primary" />
          </div>
        </div>
        <motion.div
          className="absolute -right-2 -top-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-accent" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-4xl md:text-6xl font-display font-bold mb-4 text-glow-primary"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        EYE<span className="text-primary">DETECT</span>
      </motion.h1>

      <motion.p
        className="text-xl text-muted-foreground mb-8 max-w-md"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Can your eyes keep a secret? Let's find out.
      </motion.p>

      {/* Privacy notice */}
      <motion.div
        className="glass-card rounded-xl p-6 mb-8 max-w-md"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-success" />
          <span className="font-semibold text-success">Privacy Protected</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We use your camera only for eye movement tracking during the game. 
          <span className="text-foreground font-medium"> Nothing is stored or uploaded.</span> 
          {" "}All processing happens locally on your device.
        </p>
      </motion.div>

      {/* Start button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Button 
          variant="hero" 
          size="xl"
          onClick={() => setStage('permission')}
        >
          Start Game
        </Button>
      </motion.div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="scan-line absolute inset-0 h-1/3" />
      </div>
    </motion.div>
  );
};
