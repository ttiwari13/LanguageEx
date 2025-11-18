import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Dashboard from "./pages/Dashboard";
import Settings from "./components/Settings";
import Messages from "./components/Messages";
import Friends from "./components/Friends";
import DiscoverDashboard from "./components/DiscoverDashbaord"; 
import MainLayout from "./layouts/MainLayout";

function App() {
  return (
    <Router>
      <Routes>
        
        {/* Home without Sidebar */}
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Pages WITH Sidebar */}
        <Route element={<MainLayout />}>
          <Route path="/settings" element={<Settings />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/discover" element={<DiscoverDashboard />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />

      </Routes>
    </Router>
  );
}

export default App;
