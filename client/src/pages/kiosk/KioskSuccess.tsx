import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function KioskSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { student?: any; reason?: string } | null };

  useEffect(() => {
    const t = setTimeout(() => navigate("/kiosk"), 10000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-green-600 flex flex-col items-center justify-center text-white text-center px-6">
      <div className="text-8xl mb-6">✓</div>
      <h1 className="text-4xl font-bold mb-4">Request Submitted!</h1>
      {state?.student && (
        <p className="text-xl text-green-100 mb-2">
          Hi <strong>{state.student.fullName}</strong>, your request has been received.
        </p>
      )}
      <p className="text-green-200 text-lg mb-8">
        Please go to ICT to pick up your laptop.
      </p>
      {state?.reason && (
        <div className="bg-green-700 rounded-xl px-6 py-4 text-sm text-left space-y-1 mb-10">
          <div><span className="text-green-300">Reason: </span>{state.reason}</div>
          <div><span className="text-green-300">Due back: </span>End of today</div>
        </div>
      )}
      <button
        onClick={() => navigate("/kiosk")}
        className="px-10 py-4 bg-white text-green-700 font-bold text-xl rounded-2xl hover:bg-green-50"
      >
        Done
      </button>
      <p className="mt-4 text-green-300 text-sm">Screen resets automatically in 10 seconds</p>
    </div>
  );
}
