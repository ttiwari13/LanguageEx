import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";
import DiscoverDashboard from "../components/DiscoverDashbaord";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 border-r border-gray-800">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden mb-4 p-2 bg-gray-800 rounded-lg"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} className="text-white" />
        </button>

        {/* Discover Dashboard Component */}
        <DiscoverDashboard />
      </main>
    </div>
  );
};

export default Dashboard;