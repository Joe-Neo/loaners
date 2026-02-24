import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isAdmin, enterKiosk } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: "/admin", label: "Dashboard", exact: true },
    { to: "/admin/reservations", label: "Reservations" },
    { to: "/admin/loans", label: "Active Loans" },
    { to: "/admin/history", label: "History" },
    ...(isAdmin
      ? [
          { to: "/admin/devices", label: "Devices" },
          { to: "/admin/staff", label: "Staff" },
        ]
      : []),
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname === to;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-60 bg-blue-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-blue-800">
          <h1 className="text-lg font-bold">Loaner Laptops</h1>
          <p className="text-blue-300 text-xs mt-1">
            {user?.username} &middot; {user?.role}
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.to, link.exact)
                  ? "bg-blue-700 text-white"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-blue-800 space-y-2">
          <button
            onClick={() => { enterKiosk(); navigate("/kiosk"); }}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
          >
            Enter Kiosk Mode
          </button>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="w-full px-3 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
