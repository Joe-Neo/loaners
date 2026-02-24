import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { api } from "../../api";
import type { Device } from "../../types";

const STATUS_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  reserved: "bg-yellow-100 text-yellow-700",
  checked_out: "bg-blue-100 text-blue-700",
  maintenance: "bg-orange-100 text-orange-700",
  retired: "bg-gray-100 text-gray-500",
};

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    assetNumber: "",
    barcode: "",
    make: "",
    model: "",
    serialNumber: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getDevices()
      .then((res) => setDevices(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.assetNumber || !form.barcode) {
      setFormError("Asset number and barcode are required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.createDevice(form);
      setShowForm(false);
      setForm({ assetNumber: "", barcode: "", make: "", model: "", serialNumber: "", notes: "" });
      load();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (device: Device, status: string) => {
    await api.updateDevice(device.id, { status });
    load();
  };

  return (
    <Layout>
      <div className="max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <button
            onClick={() => { setShowForm(true); setFormError(""); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            + Add Device
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Add New Device</h2>
            {formError && <p className="text-red-600 text-sm mb-3">{formError}</p>}
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "assetNumber", label: "Asset Number *" },
                { key: "barcode", label: "Barcode *" },
                { key: "make", label: "Make" },
                { key: "model", label: "Model" },
                { key: "serialNumber", label: "Serial Number" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={(form as any)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add Device"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Asset #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Barcode</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Make / Model</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Change Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.assetNumber}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{d.barcode}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {[d.make, d.model].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${STATUS_STYLES[d.status]}`}>
                        {d.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={d.status}
                        onChange={(e) => handleStatusChange(d, e.target.value)}
                        disabled={d.status === "checked_out" || d.status === "reserved"}
                        className="text-xs border border-gray-300 rounded px-2 py-1 disabled:opacity-40"
                      >
                        <option value="available">Available</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                        {d.status === "checked_out" && <option value="checked_out">Checked Out</option>}
                        {d.status === "reserved" && <option value="reserved">Reserved</option>}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
