import { NavLink } from "react-router-dom";
import { Home, MessageCircle, Camera, User2, Settings2 } from "lucide-react";

const MobileBottomNav = () => {
  const items = [
    { icon: <MessageCircle size={20} />, label: "Messages", path: "/messages" },
    { icon: <Camera size={20} />, label: "Discover", path: "/discover" },
    { icon: <User2 size={20} />, label: "Friends", path: "/friends" },
    { icon: <Settings2 size={20} />, label: "Settings", path: "/settings" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 min-w-[60px]
              ${
                isActive
                  ? "text-purple-400"
                  : "text-gray-400"
              }`
            }
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;