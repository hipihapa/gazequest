import { BackgroundGrid } from '@/components/BackgroundGrid';
import { QuestionScreen } from '@/components/QuestionScreen';

const Questions = () => {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundGrid />
      <QuestionScreen />
    </main>
  );
};

export default Questions;
