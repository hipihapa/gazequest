import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import eyeImage from '@/images/eye.jpeg';
import bgImage from '@/images/bg.jpeg';

export const IntroScreen = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50 z-0" />
      
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col items-center">
      {/* Logo/Icon */}
      {/* <motion.div
        className="relative mb-12"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full border-glow flex items-center justify-center bg-card overflow-hidden">
            <img 
              src={eyeImage} 
              alt="Eye" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain"
            />
          </div>
        </div>
        <motion.div
          className="absolute -right-3 -top-3"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-12 h-12 md:w-14 md:h-14 text-accent" />
        </motion.div>
      </motion.div> */}

      {/* Title */}
      <motion.h1
        className="text-6xl md:text-8xl font-display font-bold mb-6 text-glow-primary"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        GAZE<span className="text-primary">QUEST</span>
      </motion.h1>

      <motion.p
        className="text-2xl md:text-3xl text-muted-foreground mb-12 max-w-2xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Can your eyes keep a secret? Let's find out.
      </motion.p>

      {/* Start button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Button 
          variant="hero" 
          size="xl"
          onClick={() => navigate('/permission')}
          className="text-xl px-12 py-8"
        >
          Start Game
        </Button>
      </motion.div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="scan-line absolute inset-0 h-1/3" />
      </div>
      </div>
    </motion.div>
  );
};
