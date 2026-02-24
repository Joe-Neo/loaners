import { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout";
import { api } from "../../api";
import Scanner from "../../components/Scanner";
import type { Loan } from "../../types";

export default function ActiveLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinBarcode, setCheckinBarcode] = useState("");
  const [checkinError, setCheckinError] = useState("");
  const [checkinSuccess, setCheckinSuccess] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editModal, setEditModal] = useState<Loan | null>(null);
  const [editForm, setEditForm] = useState({ loanType: "", dueAt: "", notes: "" });
  const [editError, setEditError] = useState("");
  const [editProcessing, setEditProcessing] = useState(false);

  const load = () => {
    setLoading(true);
    api.getActiveLoans()
      .then((res) => setLoans(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCheckin = async (barcode?: string) => {
    const value = (barcode ?? checkinBarcode).trim();
    if (!value) return;
    setProcessing(true);
    setCheckinError("");
    setCheckinSuccess("");
    try {
      const res = await api.checkinLoan({ barcode: value });
      setCheckinBarcode("");
      setCheckinSuccess(`Checked in: ${res.data.student?.fullName ?? "device"}`);
      load();
      setTimeout(() => setCheckinSuccess(""), 4000);
    } catch (err: any) {
      setCheckinError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleScan = useCallback((value: string) => {
    setShowScanner(false);
    setCheckinBarcode(value);
    handleCheckin(value);
  }, []);

  const openEdit = (loan: Loan) => {
    setEditModal(loan);
    setEditForm({
      loanType: loan.loanType,
      dueAt: loan.dueAt ? new Date(loan.dueAt).toISOString().slice(0, 16) : "",
      notes: loan.notes || "",
    });
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editModal) return;
    setEditProcessing(true);
    setEditError("");
    try {
      await api.updateLoan(editModal.id, {
        loanType: editForm.loanType,
        dueAt: editForm.dueAt ? new Date(editForm.dueAt).toISOString() : undefined,
        notes: editForm.notes,
      });
      setEditModal(null);
      load();
    } catch (err: any) {
      setEditError(err.message || "Failed to update loan");
    } finally {
      setEditProcessing(false);
    }
  };

  const checkedOut = loans.filter((l) => l.status === "checked_out");
  const reserved = loans.filter((l) => l.status === "reserved");

  return (
    <Layout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Active Loans</h1>

        {/* Quick check-in */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Quick Check-In</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={checkinBarcode}
              onChange={(e) => setCheckinBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckin()}
              placeholder="Scan device barcode to check in"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowScanner(true)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
              title="Scan with camera"
            >
              📷
            </button>
            <button
              onClick={() => handleCheckin()}
              disabled={processing || !checkinBarcode.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
            >
              Check In
            </button>
          </div>
          {checkinError && <p className="text-red-600 text-xs mt-1">{checkinError}</p>}
          {checkinSuccess && <p className="text-green-600 text-xs mt-1">✓ {checkinSuccess}</p>}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <>
            {checkedOut.length > 0 && (
              <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
                <div className="px-4 py-3 bg-blue-50 border-b">
                  <h2 className="font-semibold text-blue-800">
                    Checked Out ({checkedOut.length})
                  </h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Device</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Due</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {checkedOut.map((l) => (
                      <tr key={l.id} className={`hover:bg-gray-50 ${l.isOverdue ? "bg-red-50" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{l.student?.fullName}</div>
                          <div className="text-gray-400 text-xs">{l.student?.studentId}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                          {l.device?.assetNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">
                          {l.loanType.replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(l.dueAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {l.isOverdue ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                              Overdue
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openEdit(l)}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reserved.length > 0 && (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="px-4 py-3 bg-yellow-50 border-b">
                  <h2 className="font-semibold text-yellow-800">
                    Awaiting Collection ({reserved.length})
                  </h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Reserved At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reserved.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{l.student?.fullName}</div>
                          <div className="text-gray-400 text-xs">{l.student?.studentId}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{l.reason || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(l.reservedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {loans.length === 0 && (
              <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
                No active loans
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit loan modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Loan</h2>
            <p className="text-sm text-gray-500 mb-4">
              Student: <strong>{editModal.student?.fullName}</strong> ·{" "}
              Device: <strong>{editModal.device?.assetNumber || "—"}</strong>
            </p>
            {editError && <p className="text-red-600 text-sm mb-3">{editError}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
                <select
                  value={editForm.loanType}
                  onChange={(e) => setEditForm({ ...editForm, loanType: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="day_loan">Day Loan</option>
                  <option value="extended">Extended</option>
                  <option value="repair">Repair</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date/Time</label>
                <input
                  type="datetime-local"
                  value={editForm.dueAt}
                  onChange={(e) => setEditForm({ ...editForm, dueAt: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-5">
              <button
                onClick={() => setEditModal(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {editProcessing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </Layout>
  );
}
