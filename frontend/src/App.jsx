import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DocumentChat from "./pages/DocumentChat.jsx";
import SearchAll from "./pages/SearchAll.jsx";
import Sidebar from "./components/Sidebar.jsx";
import useKeyboardShortcuts from "./components/useKeyboardShortcuts.js";

function isAuthenticated() {
  return Boolean(localStorage.getItem("documind_token"));
}

function AppLayout({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useKeyboardShortcuts(navigate);

  useEffect(() => {
    const raw = localStorage.getItem("documind_user");
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch {}
    }
  }, []);

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/document/:id" element={<ProtectedRoute><DocumentChat /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchAll /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
