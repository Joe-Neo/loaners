import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { api } from "../../api";
import type { Loan } from "../../types";

const STATUS_STYLES: Record<string, string> = {
  reserved: "bg-yellow-100 text-yellow-700",
  checked_out: "bg-blue-100 text-blue-700",
  returned: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function LoanHistory() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    api.getLoanHistory(page, limit)
      .then((res) => { setLoans(res.data); setTotal(res.total); })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  const handleExport = () => {
    api.exportLoans().catch(() => alert("Export failed"));
  };

  return (
    <Layout>
      <div className="max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Loan History</h1>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
          >
            Export CSV
          </button>
        </div>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-4 py-3 border-b text-sm text-gray-500">
            {total} total records
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Device</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Reserved</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Returned</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loans.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{l.student?.fullName}</div>
                      <div className="text-gray-400 text-xs">{l.student?.studentId}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {l.device?.assetNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {l.loanType.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${STATUS_STYLES[l.status] || ""}`}>
                        {l.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(l.reservedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {l.returnedAt ? new Date(l.returnedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex justify-between items-center text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-100 rounded disabled:opacity-40 hover:bg-gray-200"
              >
                Previous
              </button>
              <span className="text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-gray-100 rounded disabled:opacity-40 hover:bg-gray-200"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
