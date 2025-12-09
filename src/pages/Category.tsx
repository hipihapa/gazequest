import { BackgroundGrid } from '@/components/BackgroundGrid';
import { CategoryScreen } from '@/components/CategoryScreen';

const Category = () => {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundGrid />
      <CategoryScreen />
    </main>
  );
};

export default Category;
