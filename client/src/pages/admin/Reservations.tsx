import { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout";
import { api } from "../../api";
import Scanner from "../../components/Scanner";
import type { Loan } from "../../types";

type ScanTarget = "checkout" | "newLoanDevice";

export default function Reservations() {
  const [reservations, setReservations] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // Checkout existing reservation
  const [checkoutModal, setCheckoutModal] = useState<Loan | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [processing, setProcessing] = useState(false);

  // Manual loan creation
  const [showNewLoan, setShowNewLoan] = useState(false);
  const [nlStudentQuery, setNlStudentQuery] = useState("");
  const [nlStudent, setNlStudent] = useState<any>(null);
  const [nlStudentResults, setNlStudentResults] = useState<any[]>([]);
  const [nlBarcode, setNlBarcode] = useState("");
  const [nlReason, setNlReason] = useState("");
  const [nlLoanType, setNlLoanType] = useState("day_loan");
  const [nlDueAt, setNlDueAt] = useState("");
  const [nlError, setNlError] = useState("");
  const [nlProcessing, setNlProcessing] = useState(false);

  // Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<ScanTarget>("checkout");

  const load = () => {
    setLoading(true);
    api.getReservations()
      .then((res) => setReservations(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCheckout = async () => {
    if (!checkoutModal || !barcodeInput.trim()) return;
    setProcessing(true);
    setCheckoutError("");
    try {
      await api.checkoutLoan(checkoutModal.id, { barcode: barcodeInput.trim() });
      setCheckoutModal(null);
      setBarcodeInput("");
      load();
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this reservation?")) return;
    await api.cancelLoan(id);
    load();
  };

  const handleScan = useCallback((value: string) => {
    setShowScanner(false);
    if (scanTarget === "checkout") {
      setBarcodeInput(value);
    } else {
      setNlBarcode(value);
    }
  }, [scanTarget]);

  const openScanner = (target: ScanTarget) => {
    setScanTarget(target);
    setShowScanner(true);
  };

  // New loan helpers
  const searchNlStudent = async () => {
    if (!nlStudentQuery.trim()) return;
    try {
      // Try exact ID lookup first
      try {
        const res = await api.lookupStudent(nlStudentQuery.trim());
        setNlStudent(res.data);
        setNlStudentResults([]);
        return;
      } catch {}
      // Fall back to name search
      const res = await api.searchStudents(nlStudentQuery.trim());
      setNlStudentResults(res.data);
      if (res.data.length === 0) setNlError("No students found");
    } catch {
      setNlError("Search failed");
    }
  };

  const handleCreateManualLoan = async () => {
    if (!nlStudent || !nlBarcode.trim()) {
      setNlError("Student and device barcode are required");
      return;
    }
    setNlProcessing(true);
    setNlError("");
    try {
      await api.createManualLoan({
        studentId: nlStudent.studentId,
        barcode: nlBarcode.trim(),
        reason: nlReason,
        loanType: nlLoanType,
        dueAt: nlDueAt || undefined,
      });
      setShowNewLoan(false);
      resetNewLoan();
      load();
    } catch (err: any) {
      setNlError(err.message || "Failed to create loan");
    } finally {
      setNlProcessing(false);
    }
  };

  const resetNewLoan = () => {
    setNlStudentQuery("");
    setNlStudent(null);
    setNlStudentResults([]);
    setNlBarcode("");
    setNlReason("");
    setNlLoanType("day_loan");
    setNlDueAt("");
    setNlError("");
  };

  return (
    <Layout>
      <div className="max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => { resetNewLoan(); setShowNewLoan(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + New Loan (Walk-in)
            </button>
            <button onClick={load} className="text-sm text-blue-600 hover:underline px-2">
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            No pending reservations
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Reserved At</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.student.fullName}</div>
                      <div className="text-gray-400 text-xs">{r.student.studentId}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.reason || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(r.reservedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => {
                          setCheckoutModal(r);
                          setCheckoutError("");
                          setBarcodeInput("");
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Check Out
                      </button>
                      <button
                        onClick={() => handleCancel(r.id)}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Checkout reservation modal */}
        {checkoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold mb-1">Check Out Device</h2>
              <p className="text-sm text-gray-500 mb-4">
                Student: <strong>{checkoutModal.student.fullName}</strong>
              </p>
              {checkoutError && <p className="text-red-600 text-sm mb-3">{checkoutError}</p>}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scan or enter device barcode
              </label>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Device barcode"
                  autoFocus
                />
                <button
                  onClick={() => openScanner("checkout")}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                  title="Scan with camera"
                >
                  📷
                </button>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setCheckoutModal(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={processing || !barcodeInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Check Out"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New manual loan modal */}
        {showNewLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">New Walk-in Loan</h2>
              {nlError && <p className="text-red-600 text-sm mb-3">{nlError}</p>}

              {/* Student lookup */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                {nlStudent ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
                    <div>
                      <div className="font-medium text-sm">{nlStudent.fullName}</div>
                      <div className="text-xs text-gray-500">{nlStudent.studentId}{nlStudent.tutorGroup ? ` · ${nlStudent.tutorGroup}` : ""}</div>
                    </div>
                    <button onClick={() => { setNlStudent(null); setNlStudentResults([]); }} className="text-xs text-gray-400 hover:text-gray-600">
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={nlStudentQuery}
                        onChange={(e) => setNlStudentQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchNlStudent()}
                        placeholder="Student ID or name"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={searchNlStudent}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        Search
                      </button>
                    </div>
                    {nlStudentResults.length > 0 && (
                      <div className="border border-gray-200 rounded-md divide-y max-h-36 overflow-y-auto">
                        {nlStudentResults.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => { setNlStudent(s); setNlStudentResults([]); }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                          >
                            <div className="font-medium">{s.fullName}</div>
                            <div className="text-gray-400 text-xs">{s.studentId}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Device barcode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Device Barcode</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={nlBarcode}
                    onChange={(e) => setNlBarcode(e.target.value)}
                    placeholder="Scan or type device barcode"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => openScanner("newLoanDevice")}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                    title="Scan with camera"
                  >
                    📷
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={nlReason}
                  onChange={(e) => setNlReason(e.target.value)}
                  placeholder="e.g. Forgot laptop"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Loan type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
                <select
                  value={nlLoanType}
                  onChange={(e) => setNlLoanType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="day_loan">Day Loan (returns end of day)</option>
                  <option value="extended">Extended</option>
                  <option value="repair">Repair</option>
                </select>
              </div>

              {/* Due date (optional override) */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date/Time <span className="text-gray-400 font-normal">(optional — defaults to end of day)</span>
                </label>
                <input
                  type="datetime-local"
                  value={nlDueAt}
                  onChange={(e) => setNlDueAt(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { setShowNewLoan(false); resetNewLoan(); }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateManualLoan}
                  disabled={nlProcessing || !nlStudent || !nlBarcode.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {nlProcessing ? "Creating..." : "Check Out Now"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showScanner && (
          <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
        )}
      </div>
    </Layout>
  );
}
