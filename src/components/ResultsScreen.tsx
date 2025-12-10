import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { Eye, AlertTriangle, CheckCircle2, HelpCircle, RotateCcw, Share2 } from 'lucide-react';

const MetricBar = ({ label, value, maxValue = 100, color }: {
  label: string;
  value: number;
  maxValue?: number;
  color: 'success' | 'warning' | 'suspicious' | 'primary';
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);

  const colorClasses = {
    success: 'bg-success',
    warning: 'bg-warning',
    suspicious: 'bg-suspicious',
    primary: 'bg-primary',
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{Math.round(value)}{maxValue === 100 ? '%' : ''}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export const ResultsScreen = () => {
  const navigate = useNavigate();
  const { behaviorMetrics, resetGame } = useGameStore();

  const handlePlayAgain = () => {
    resetGame();
    navigate('/category');
  };

  if (!behaviorMetrics) return null;

  const {
    avgGazeStability,
    avgBlinkRate,
    avgHeadMovement,
    avgResponseTime,
    totalLookAways,
    confidenceScore,
    verdict
  } = behaviorMetrics;

  const verdictConfig = {
    confident: {
      icon: CheckCircle2,
      title: 'Very Confident',
      subtitle: 'Your eyes tell no lies! 😎',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      glowClass: 'glow-success',
    },
    mixed: {
      icon: HelpCircle,
      title: 'Mixed Signals',
      subtitle: 'Hmm... something seems off 🤔',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
      glowClass: 'glow-accent',
    },
    suspicious: {
      icon: AlertTriangle,
      title: 'Suspicious',
      subtitle: 'Your eyes gave you away! 👀',
      color: 'text-suspicious',
      bgColor: 'bg-suspicious/10',
      borderColor: 'border-suspicious/30',
      glowClass: 'glow-suspicious',
    },
  };

  const config = verdictConfig[verdict];
  const VerdictIcon = config.icon;

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-6 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-lg">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-primary" />
            <span className="text-sm text-primary font-medium uppercase tracking-wider">Analysis Complete</span>
          </div>
          <h2 className="text-3xl font-display font-bold">Your Results</h2>
        </motion.div>

        {/* Verdict card */}
        <motion.div
          className={`${config.bgColor} ${config.borderColor} border rounded-2xl p-8 text-center mb-8 ${config.glowClass}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <VerdictIcon className={`w-20 h-20 mx-auto mb-4 ${config.color}`} />
          </motion.div>

          <h3 className={`text-2xl font-display font-bold mb-2 ${config.color}`}>
            {config.title}
          </h3>
          <p className="text-lg text-muted-foreground mb-4">{config.subtitle}</p>

          {/* Confidence score */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50">
            <span className="text-sm text-muted-foreground">Confidence Score:</span>
            <span className={`text-2xl font-display font-bold ${config.color}`}>
              {Math.round(confidenceScore)}%
            </span>
          </div>
        </motion.div>

        {/* Detailed metrics */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h4 className="font-display font-semibold mb-4 text-lg">Behavior Breakdown</h4>

          <MetricBar
            label="Gaze Stability"
            value={avgGazeStability}
            color={avgGazeStability > 80 ? 'success' : avgGazeStability > 60 ? 'warning' : 'suspicious'}
          />

          <MetricBar
            label="Blink Activity"
            value={avgBlinkRate}
            maxValue={30}
            color={avgBlinkRate < 10 ? 'success' : avgBlinkRate < 20 ? 'warning' : 'suspicious'}
          />

          <MetricBar
            label="Head Steadiness"
            value={100 - avgHeadMovement}
            color={avgHeadMovement < 15 ? 'success' : avgHeadMovement < 30 ? 'warning' : 'suspicious'}
          />

          <div className="flex justify-between text-sm pt-4 border-t border-border mt-4">
            <div>
              <span className="text-muted-foreground">Avg Response Time</span>
              <p className="font-semibold">{(avgResponseTime / 1000).toFixed(1)}s</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Look Aways</span>
              <p className="font-semibold">{totalLookAways}</p>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            variant="hero"
            size="lg"
            onClick={handlePlayAgain}
            className="flex-1"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'GazeQuest Results',
                  text: `I scored ${Math.round(confidenceScore)}% on GazeQuest! Can your eyes keep a secret?`,
                });
              }
            }}
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Score
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
