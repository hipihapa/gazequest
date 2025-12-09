import { BackgroundGrid } from '@/components/BackgroundGrid';
import { ResultsScreen } from '@/components/ResultsScreen';

const Results = () => {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundGrid />
      <ResultsScreen />
    </main>
  );
};

export default Results;
