import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { BackgroundGrid } from '@/components/BackgroundGrid';
import { IntroScreen } from '@/components/IntroScreen';
import { CameraPermission } from '@/components/CameraPermission';
import { CalibrationScreen } from '@/components/CalibrationScreen';
import { QuestionScreen } from '@/components/QuestionScreen';
import { ResultsScreen } from '@/components/ResultsScreen';

const Index = () => {
  const stage = useGameStore((state) => state.stage);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundGrid />
      
      <AnimatePresence mode="wait">
        {stage === 'intro' && <IntroScreen key="intro" />}
        {stage === 'permission' && <CameraPermission key="permission" />}
        {stage === 'calibration' && <CalibrationScreen key="calibration" />}
        {stage === 'questions' && <QuestionScreen key="questions" />}
        {stage === 'results' && <ResultsScreen key="results" />}
      </AnimatePresence>
    </main>
  );
};

export default Index;
