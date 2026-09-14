import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function NavItem({ to, icon, label, shortcut, active }) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
        active
          ? "bg-gray-100 text-gray-900"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className="text-base leading-none w-4 text-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && (
        <kbd className={`text-xs px-1.5 py-0.5 rounded border font-mono hidden group-hover:inline-block ${
          active ? "border-gray-300 text-gray-500 bg-white" : "border-gray-200 text-gray-400 bg-gray-50"
        }`}>
          {shortcut}
        </kbd>
      )}
    </Link>
  );
}

function RecentDocs({ currentPath }) {
  const recent = JSON.parse(localStorage.getItem("dm_recent") || "[]").slice(0, 4);
  if (recent.length === 0) {
    return <p className="px-3 py-1 text-xs text-gray-400 italic">No recent documents</p>;
  }
  return recent.map((doc) => (
    <Link
      key={doc.id}
      to={`/document/${doc.id}`}
      title={doc.name}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all truncate ${
        currentPath === `/document/${doc.id}`
          ? "bg-gray-100 text-gray-900"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-gray-300">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <span className="truncate text-xs">{doc.name}</span>
    </Link>
  ));
}

export default function Sidebar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  function handleLogout() {
    localStorage.removeItem("documind_token");
    localStorage.removeItem("documind_user");
    localStorage.removeItem("dm_recent");
    navigate("/login");
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center flex-shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm tracking-tight">DocuMind</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 py-1 mb-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Workspace</span>
        </div>

        <NavItem to="/" icon="⊞" label="Documents" active={location.pathname === "/"} />
        <NavItem
          to="/search"
          icon="⌕"
          label="Search"
          shortcut="⌘K"
          active={location.pathname === "/search"}
        />

        <div className="px-3 pt-4 pb-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recent</span>
        </div>

        <RecentDocs currentPath={location.pathname} />
      </nav>

      {/* Help hint */}
      <div className="px-4 py-2 border-t border-gray-100 flex-shrink-0">
        <p className="text-xs text-gray-400">
          Press <kbd className="text-xs px-1 py-0.5 rounded border border-gray-200 font-mono bg-gray-50">/</kbd> to search
        </p>
      </div>

      {/* User */}
      <div className="border-t border-gray-100 p-3 relative flex-shrink-0">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
        >
          <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate leading-tight">{user?.name || "User"}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email || ""}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0">
            <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
          </svg>
        </button>

        {showUserMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
