import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Dashboard from "./pages/Dashboard";
import Settings from "./components/Settings";
import Messages from "./components/Messages";
import Friends from "./components/Friends";
import DiscoverDashboard from "./components/DiscoverDashbaord"; 
import MainLayout from "./layouts/MainLayout";
import ChatPage from "./components/ChatPage";
import ProtectedRoute, { PublicRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Home />
            </PublicRoute>
          } 
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route element={<MainLayout />}>
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:chatRoomId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <DiscoverDashboard />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />

      </Routes>
    </Router>
  );
}

export default App;