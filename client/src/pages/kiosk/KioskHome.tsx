import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

export default function KioskHome() {
  const navigate = useNavigate();
  const { user, exitKiosk } = useAuth();
  const [showExitModal, setShowExitModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [exitPassword, setExitPassword] = useState("");
  const [exitError, setExitError] = useState("");
  const [exiting, setExiting] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const { login, enterKiosk } = useAuth();

  const handleExitKiosk = async () => {
    if (!exitPassword) return;
    setExiting(true);
    setExitError("");
    const success = await exitKiosk(exitPassword);
    if (success) {
      setShowExitModal(false);
      navigate("/admin");
    } else {
      setExitError("Incorrect password");
    }
    setExiting(false);
    setExitPassword("");
  };

  const handleAdminLogin = async () => {
    if (!loginUsername || !loginPassword) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      await login(loginUsername, loginPassword);
      enterKiosk();
      setShowLoginModal(false);
      navigate("/admin");
    } catch {
      setLoginError("Invalid credentials");
    } finally {
      setLoginLoading(false);
    }
  };

  const openExit = () => {
    if (user) {
      setShowExitModal(true);
      setExitError("");
      setExitPassword("");
    } else {
      setShowLoginModal(true);
      setLoginError("");
      setLoginUsername("");
      setLoginPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center text-white select-none">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-3">Loaner Laptops</h1>
        <p className="text-blue-300 text-xl">ICT Department Self-Service Kiosk</p>
      </div>

      <div className="w-full max-w-lg px-6">
        <button
          onClick={() => navigate("/kiosk/checkout")}
          className="w-full py-10 text-3xl font-bold bg-green-500 hover:bg-green-400 active:bg-green-600 rounded-2xl shadow-lg transition-colors"
        >
          Request a Laptop
        </button>
      </div>

      <p className="mt-12 text-blue-400 text-sm text-center px-6">
        Collect your device from ICT staff after submitting your request
      </p>

      {/* Small exit button, bottom-right */}
      <button
        onClick={openExit}
        className="fixed bottom-4 right-4 text-xs text-blue-400 bg-blue-800 hover:bg-blue-700 px-3 py-2 rounded opacity-50 hover:opacity-100 transition-opacity"
      >
        {user ? "Exit Kiosk" : "Staff Login"}
      </button>

      {/* Exit kiosk modal (for logged-in staff) */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-gray-900">
            <h2 className="text-xl font-bold mb-1">Exit Kiosk Mode</h2>
            <p className="text-gray-500 text-sm mb-4">Enter your password to exit</p>
            {exitError && <p className="text-red-600 text-sm mb-3">{exitError}</p>}
            <input
              type="password"
              value={exitPassword}
              onChange={(e) => setExitPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExitKiosk()}
              placeholder="Password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleExitKiosk}
                disabled={exiting || !exitPassword}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {exiting ? "Verifying..." : "Exit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff login modal (no session) */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-gray-900">
            <h2 className="text-xl font-bold mb-1">Staff Login</h2>
            <p className="text-gray-500 text-sm mb-4">Sign in to access admin mode</p>
            {loginError && <p className="text-red-600 text-sm mb-3">{loginError}</p>}
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="Username or email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              placeholder="Password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminLogin}
                disabled={loginLoading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {loginLoading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
