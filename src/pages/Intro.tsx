import { BackgroundGrid } from '@/components/BackgroundGrid';
import { IntroScreen } from '@/components/IntroScreen';

const Intro = () => {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundGrid />
      <IntroScreen />
    </main>
  );
};

export default Intro;
