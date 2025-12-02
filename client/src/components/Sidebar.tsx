import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, MessageCircle, Camera, User2, Settings2 } from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
  compact?: boolean;
}

interface UserProfile {
  name?: string;
  fullname?: string;
  username?: string;
  profile_image_public_id?: string;
}

const Sidebar = ({ onClose, compact = false }: SidebarProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:4000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load user");
        return res.json();
      })
      .then((data) => {
        const u = data.user || data;
        setUser(u);
      })
      .catch((err) => console.error("Sidebar user fetch error:", err));
  }, []);

  const items = [
    { icon: <MessageCircle size={22} />, label: "Messages", path: "/messages" },
    { icon: <Camera size={22} />, label: "Discover", path: "/discover" },
    { icon: <User2 size={22} />, label: "Friends", path: "/friends" },
    { icon: <Settings2 size={22} />, label: "Settings", path: "/settings" },
  ];
  return (
    <div className="h-full w-full bg-gradient-to-b from-gray-900 to-gray-950 text-white flex flex-col">
      
      {/* Header */}
      <div className={`p-6 border-b border-gray-800 ${compact ? "flex justify-center" : ""}`}>
        <div className="flex items-center justify-between">
          <h1
            className={`text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent ${
              compact ? "hidden" : ""
            }`}
          >
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
                `w-full flex items-center ${
                  compact ? "justify-center" : "gap-4"
                } px-4 py-3.5 rounded-xl transition-all duration-300 group relative
                  ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`
              }
            >
              {item.icon}
              <span className={`font-medium ${compact ? "hidden" : ""}`}>{item.label}</span>

              {compact && (
                <span className="absolute left-full ml-2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  );
};

export default Sidebar;
