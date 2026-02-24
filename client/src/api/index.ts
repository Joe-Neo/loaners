const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ data: { token: string; staff: any } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ data: any }>("/auth/me"),

  // Students
  lookupStudent: (studentId: string) =>
    request<{ data: any }>(`/students/lookup?studentId=${encodeURIComponent(studentId)}`),
  searchStudents: (query: string) =>
    request<{ data: any[] }>(`/students/lookup?query=${encodeURIComponent(query)}`),
  upsertStudent: (data: { studentId: string; fullName: string; email?: string; tutorGroup?: string }) =>
    request<{ data: any }>("/students", { method: "POST", body: JSON.stringify(data) }),

  // Devices
  getAvailableCount: () => request<{ available: number }>("/devices/available-count"),
  getDevices: () => request<{ data: any[] }>("/devices"),
  lookupDevice: (params: { barcode?: string; qrCode?: string; assetNumber?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<{ data: any }>(`/devices/lookup?${q}`);
  },
  createDevice: (data: any) =>
    request<{ data: any }>("/devices", { method: "POST", body: JSON.stringify(data) }),
  updateDevice: (id: number, data: any) =>
    request<{ data: any }>(`/devices/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Loans
  createManualLoan: (data: { studentId: string; barcode?: string; qrCode?: string; reason?: string; loanType?: string; dueAt?: string }) =>
    request<{ data: any }>("/loans/manual", { method: "POST", body: JSON.stringify(data) }),
  reserveLoan: (data: { studentId: string; reason?: string }) =>
    request<{ data: any }>("/loans/reserve", { method: "POST", body: JSON.stringify(data) }),
  getReservations: () => request<{ data: any[] }>("/loans/reservations"),
  checkoutLoan: (loanId: number, data: { barcode?: string; qrCode?: string }) =>
    request<{ data: any }>(`/loans/${loanId}/checkout`, { method: "POST", body: JSON.stringify(data) }),
  checkinLoan: (data: { barcode?: string; qrCode?: string }) =>
    request<{ data: any }>("/loans/checkin", { method: "POST", body: JSON.stringify(data) }),
  getActiveLoans: () => request<{ data: any[] }>("/loans/active"),
  getLoanHistory: (page = 1, limit = 25) =>
    request<{ data: any[]; total: number; page: number; limit: number }>(`/loans/history?page=${page}&limit=${limit}`),
  updateLoan: (id: number, data: any) =>
    request<{ data: any }>(`/loans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  cancelLoan: (id: number) =>
    request<{ data: any }>(`/loans/${id}`, { method: "DELETE" }),

  // Loans export (triggers browser download)
  exportLoans: () => {
    const token = localStorage.getItem("token");
    const a = document.createElement("a");
    a.href = `/api/loans/export`;
    // Attach token via fetch then create object URL
    return fetch("/api/loans/export", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((res) => res.blob()).then((blob) => {
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `loans-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  },

  // Dashboard
  getStats: () => request<{ data: any }>("/dashboard/stats"),

  // Staff
  getStaff: () => request<{ data: any[] }>("/staff"),
  createStaff: (data: any) =>
    request<{ data: any }>("/staff", { method: "POST", body: JSON.stringify(data) }),
  updateStaff: (id: number, data: any) =>
    request<{ data: any }>(`/staff/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};
