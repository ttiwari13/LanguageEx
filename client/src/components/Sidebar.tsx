import { useState } from "react";
import { HomeIcon, MessageCircle, Camera, User2, Settings2Icon, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const [activeIndex, setActiveIndex] = useState(2); // Discover active by default
  const navigate = useNavigate();
  const items = [
    { icon: <HomeIcon size={22} />, label: "Home", path: "/" },
    { icon: <MessageCircle size={22} />, label: "Messages", path: "/messages" },
    { icon: <Camera size={22} />, label: "Discover", path: "/dashboard" },
    { icon: <User2 size={22} />, label: "Friends", path: "/friends" },
    { icon: <Settings2Icon size={22} />, label: "Settings", path: "/settings" }, // <-- important
  ];

  return (
    <div className="h-full w-full bg-gradient-to-b from-gray-900 to-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Flamess
          </h1>
          {onClose && (
            <button
              className="md:hidden text-gray-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Menu Items */}
    <nav className="flex-1 px-4 py-8">
        <div className="space-y-2">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveIndex(index);
                navigate(item.path);   // <-- Navigation happens here
                if (onClose) onClose(); // close sidebar on mobile
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                activeIndex === index
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Footer/Profile Section */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 cursor-pointer transition-all">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
            JD
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">John Doe</p>
            <p className="text-xs text-gray-500">@johndoe</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;