import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

interface FeedbackCardProps {
  verdict: 'truthful' | 'suspicious';
  confidence: number;
  onComplete: () => void;
}

const TRUTHFUL_PHRASES = [
  "You're telling the truth!",
  "That was honest!",
  "You passed the test!",
  "No lies detected!",
  "Your eyes don't lie!",
];

const SUSPICIOUS_PHRASES = [
  "Something's fishy here...",
  "Your eyes say otherwise!",
  "That looked suspicious...",
  "We caught you lying!",
  "Not so fast, fibber!",
];

export const FeedbackCard = ({ verdict, confidence, onComplete }: FeedbackCardProps) => {
  const isTruthful = verdict === 'truthful';
  const phrases = isTruthful ? TRUTHFUL_PHRASES : SUSPICIOUS_PHRASES;
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2500);
      }}
    >
      <motion.div
        className={`glass-card rounded-2xl p-12 text-center min-w-[400px] border-2 ${
          isTruthful
            ? 'border-success bg-success/5 glow-success'
            : 'border-destructive bg-destructive/5 glow-destructive'
        }`}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ 
          type: "spring", 
          damping: 15,
          stiffness: 300,
        }}
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 10 }}
          className="flex justify-center mb-6"
        >
          {isTruthful ? (
            <CheckCircle2 
              className="w-24 h-24 text-success" 
              strokeWidth={2}
            />
          ) : (
            <XCircle 
              className="w-24 h-24 text-destructive" 
              strokeWidth={2}
            />
          )}
        </motion.div>

        {/* Phrase */}
        <motion.h2
          className={`text-3xl font-display font-bold mb-6 ${
            isTruthful ? 'text-success' : 'text-destructive'
          }`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {phrase}
        </motion.h2>

        {/* Confidence */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-muted-foreground mb-2">Confidence</p>
          <div className="relative">
            <motion.div
              className={`text-5xl font-bold ${
                isTruthful ? 'text-success' : 'text-destructive'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              {confidence}%
            </motion.div>
          </div>
        </motion.div>

        {/* Animated pulse effect */}
        <motion.div
          className={`absolute inset-0 rounded-2xl pointer-events-none ${
            isTruthful ? 'bg-success/20' : 'bg-destructive/20'
          }`}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </motion.div>
  );
};
