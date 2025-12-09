import { BackgroundGrid } from '@/components/BackgroundGrid';
import { CameraPermission } from '@/components/CameraPermission';

const Permission = () => {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundGrid />
      <CameraPermission />
    </main>
  );
};

export default Permission;
