import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MobileBottomNav from '../components/MobileBottomNav';

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-gray-900">
      <div className="hidden md:block lg:hidden w-20 flex-shrink-0">
        <Sidebar compact={true} />
      </div>
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;