import { NavLink } from "react-router-dom";
import { Home, MessageCircle, Camera, User2, Settings2, X } from "lucide-react";

interface SidebarProps { 
  onClose?: () => void;
  compact?: boolean;
}
const Sidebar = ({ onClose, compact = false }: SidebarProps) => {
  const items = [
    { icon: <Home size={22} />, label: "Home", path: "/" },
    { icon: <MessageCircle size={22} />, label: "Messages", path: "/messages" },
    { icon: <Camera size={22} />, label: "Discover", path: "/discover" },
    { icon: <User2 size={22} />, label: "Friends", path: "/friends" },
    { icon: <Settings2 size={22} />, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="h-full w-full bg-gradient-to-b from-gray-900 to-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className={`p-6 border-b border-gray-800 ${compact ? 'flex justify-center' : ''}`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent ${compact ? 'hidden' : ''}`}>
            Flamess
          </h1>
          {compact && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-xl font-bold">
              F
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-8">
        <div className="space-y-2">
          {items.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `w-full flex items-center ${compact ? 'justify-center' : 'gap-4'} px-4 py-3.5 rounded-xl transition-all duration-300 group relative
                ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`
              }
            >
              {item.icon}
              <span className={`font-medium ${compact ? 'hidden' : ''}`}>{item.label}</span>
              
              {/* Tooltip for compact mode */}
              {compact && (
                <span className="absolute left-full ml-2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer/Profile */}
      <div className="p-4 border-t border-gray-800">
        <div className={`flex items-center ${compact ? 'justify-center' : 'gap-3'} p-3 rounded-xl hover:bg-gray-800/50 cursor-pointer transition-all group relative`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
            JD
          </div>
          {!compact && (
            <div className="flex-1">
              <p className="text-sm font-medium text-white">John Doe</p>
              <p className="text-xs text-gray-500">@johndoe</p>
            </div>
          )}
          
          {/* Tooltip for compact mode */}
          {compact && (
            <span className="absolute left-full ml-2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
              John Doe
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;