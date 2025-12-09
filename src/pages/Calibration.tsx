import { BackgroundGrid } from '@/components/BackgroundGrid';
import { CalibrationScreen } from '@/components/CalibrationScreen';

const Calibration = () => {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundGrid />
      <CalibrationScreen />
    </main>
  );
};

export default Calibration;
