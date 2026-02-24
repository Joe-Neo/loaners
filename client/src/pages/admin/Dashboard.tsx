import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { api } from "../../api";
import type { DashboardStats } from "../../types";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: "Available", value: stats.available, color: "bg-green-500", link: "/admin/devices" },
        { label: "Checked Out", value: stats.checkedOut, color: "bg-blue-500", link: "/admin/loans" },
        { label: "Reserved", value: stats.reserved, color: "bg-yellow-500", link: "/admin/reservations" },
        { label: "Overdue", value: stats.overdue, color: "bg-red-500", link: "/admin/loans" },
        { label: "Maintenance", value: stats.maintenance, color: "bg-gray-400", link: "/admin/devices" },
      ]
    : [];

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      {loading ? (
        <p className="text-gray-500">Loading stats...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl">
          {cards.map((card) => (
            <Link
              key={card.label}
              to={card.link}
              className="bg-white rounded-xl shadow p-4 flex flex-col items-center hover:shadow-md transition-shadow"
            >
              <span
                className={`text-3xl font-bold text-white ${card.color} rounded-full w-16 h-16 flex items-center justify-center mb-2`}
              >
                {card.value}
              </span>
              <span className="text-sm font-medium text-gray-600">{card.label}</span>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
