import Sidebar from "../components/Sidebar";
import DiscoverDashboard from "../components/DiscoverDashbaord";
import MobileBottomNav from "../components/MobileBottomNav";

const Dashboard = () => {
  return (
    <div className="h-screen flex bg-gray-900">
      
      {/* LEFT SIDEBAR → Only for large screens */}
      <div className="hidden lg:block w-64 border-r border-gray-800">
        <Sidebar />
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 pb-20 lg:pb-8">
        <DiscoverDashboard />
      </main>

      {/* BOTTOM NAV → Only for mobile + tablet */}
      <MobileBottomNav />
    </div>
  );
};

export default Dashboard;
