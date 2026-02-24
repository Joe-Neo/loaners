import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import Scanner from "../../components/Scanner";

type Step = "identify" | "reason";

const REASON_OPTIONS = [
  "Forgot laptop",
  "Laptop not working",
  "Other",
];

export default function KioskCheckout() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("identify");
  const [searchMode, setSearchMode] = useState<"id" | "name">("id");
  const [studentInput, setStudentInput] = useState("");
  const [student, setStudent] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [reason, setReason] = useState("");
  const [otherDescription, setOtherDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live search: fires 300ms after each keystroke when in name mode and ≥2 chars
  useEffect(() => {
    if (searchMode !== "name") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (studentInput.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.searchStudents(studentInput.trim());
        setSearchResults(res.data);
        if (res.data.length === 0) setError("No students found. Please ask ICT staff.");
      } catch {
        setError("Search failed. Please ask ICT staff.");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [studentInput, searchMode]);

  const handleLookupById = async (id?: string) => {
    const value = (id ?? studentInput).trim();
    if (!value) return;
    setLoading(true);
    setError("");
    setSearchResults([]);
    try {
      const res = await api.lookupStudent(value);
      setStudent(res.data);
      setStep("reason");
    } catch {
      setError("Student not found. Try searching by name, or ask ICT staff.");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = useCallback((value: string) => {
    setShowScanner(false);
    setStudentInput(value);
    // Auto-lookup after scan
    handleLookupById(value);
  }, []);

  const handleSubmit = async () => {
    if (!student || !reason) return;
    if (reason === "Other" && !otherDescription.trim()) return;
    setLoading(true);
    setError("");
    const finalReason = reason === "Other" ? otherDescription.trim() : reason;
    try {
      await api.reserveLoan({ studentId: student.studentId, reason: finalReason });
      navigate("/kiosk/success", { state: { student, reason: finalReason } });
    } catch (err: any) {
      setError(err.message || "Failed to submit request. Please ask ICT staff.");
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || !reason || (reason === "Other" && !otherDescription.trim());

  return (
    <div className="min-h-screen bg-blue-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-5 flex items-center justify-between border-b border-blue-800">
        <button
          onClick={() => (step === "reason" ? setStep("identify") : navigate("/kiosk"))}
          className="text-blue-300 hover:text-white text-lg"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold">Request a Laptop</h1>
        <div className="w-16" />
      </div>

      {/* Step indicator */}
      <div className="flex px-6 pt-4 space-x-2">
        {["Identify", "Reason"].map((label, i) => {
          const stepIndex = step === "identify" ? 0 : 1;
          return (
            <div key={label} className={`flex-1 h-1 rounded-full ${i <= stepIndex ? "bg-green-400" : "bg-blue-700"}`} />
          );
        })}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-lg mx-auto w-full">

        {/* Step 1: Identify */}
        {step === "identify" && (
          <div className="w-full">
            <h2 className="text-3xl font-bold mb-2 text-center">Who are you?</h2>
            <p className="text-blue-300 text-center mb-8">
              Scan your student ID barcode, or search by name
            </p>

            <div className="flex rounded-xl overflow-hidden mb-6 border border-blue-700">
              <button
                onClick={() => { setSearchMode("id"); setStudentInput(""); setSearchResults([]); setStudent(null); setError(""); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${searchMode === "id" ? "bg-blue-600 text-white" : "bg-blue-800 text-blue-300"}`}
              >
                Student ID / Barcode
              </button>
              <button
                onClick={() => { setSearchMode("name"); setStudentInput(""); setSearchResults([]); setStudent(null); setError(""); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${searchMode === "name" ? "bg-blue-600 text-white" : "bg-blue-800 text-blue-300"}`}
              >
                Search by Name
              </button>
            </div>

            {/* Show selected student confirmation, or input */}
            {searchMode === "name" && student ? (
              <div className="bg-green-600 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">{student.fullName}</div>
                  <div className="text-green-200 text-sm">
                    {student.studentId}{student.tutorGroup ? ` · ${student.tutorGroup}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => { setStudent(null); setStudentInput(""); setSearchResults([]); setError(""); }}
                  className="text-green-200 hover:text-white text-sm underline ml-4"
                >
                  Change
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={studentInput}
                onChange={(e) => { setStudentInput(e.target.value); if (student) setStudent(null); }}
                onKeyDown={(e) => e.key === "Enter" && searchMode === "id" && handleLookupById()}
                placeholder={searchMode === "id" ? "Scan or type your student ID" : "Type your name"}
                className="w-full bg-blue-800 border border-blue-600 rounded-xl px-5 py-4 text-xl text-white placeholder-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
                autoFocus
              />
            )}

            {searchMode === "id" && (
              <button
                onClick={() => setShowScanner(true)}
                className="w-full py-3 bg-blue-700 hover:bg-blue-600 rounded-xl text-base font-medium transition-colors mb-4 flex items-center justify-center space-x-2"
              >
                <span>📷</span>
                <span>Scan with Camera</span>
              </button>
            )}

            {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}

            {/* Live search results (name mode only, when no student selected) */}
            {searchMode === "name" && !student && searchResults.length > 0 && (
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {searchResults.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setStudent(s); setSearchResults([]); setError(""); }}
                    className="w-full bg-blue-800 hover:bg-blue-700 rounded-xl p-4 text-left transition-colors"
                  >
                    <div className="font-semibold">{s.fullName}</div>
                    <div className="text-blue-300 text-sm">
                      {s.studentId}
                      {s.tutorGroup ? ` · ${s.tutorGroup}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={searchMode === "id" ? () => handleLookupById() : () => setStep("reason")}
              disabled={searchMode === "id" ? (loading || !studentInput.trim()) : (loading || !student)}
              className="w-full py-5 bg-green-500 hover:bg-green-400 disabled:bg-blue-800 disabled:text-blue-500 rounded-2xl text-2xl font-bold transition-colors mt-2"
            >
              {loading ? "Searching..." : "Continue →"}
            </button>
          </div>
        )}

        {/* Step 2: Reason */}
        {step === "reason" && student && (
          <div className="w-full">
            <div className="bg-blue-800 rounded-xl p-4 mb-6 text-center">
              <p className="text-blue-400 text-sm">Logged in as</p>
              <p className="text-2xl font-bold">{student.fullName}</p>
              {student.tutorGroup && (
                <p className="text-blue-300 text-sm">{student.tutorGroup}</p>
              )}
            </div>

            <h2 className="text-2xl font-bold mb-2 text-center">Why do you need a loaner?</h2>
            <p className="text-blue-300 text-center mb-6 text-sm">Select the best reason</p>

            <div className="space-y-3 mb-4">
              {REASON_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setReason(r); setOtherDescription(""); }}
                  className={`w-full py-4 rounded-xl text-lg font-medium transition-colors ${
                    reason === r
                      ? "bg-green-500 text-white"
                      : "bg-blue-800 hover:bg-blue-700 text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {reason === "Other" && (
              <textarea
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value)}
                placeholder="Please describe the problem…"
                rows={3}
                className="w-full bg-blue-800 border border-blue-600 rounded-xl px-5 py-4 text-white placeholder-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4 resize-none"
                autoFocus
              />
            )}

            {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="w-full py-5 bg-green-500 hover:bg-green-400 disabled:bg-blue-800 disabled:text-blue-500 rounded-2xl text-2xl font-bold transition-colors"
            >
              {loading ? "Submitting..." : "Submit Request →"}
            </button>
          </div>
        )}
      </div>

      {showScanner && (
        <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
