export interface Staff {
  id: number;
  username: string;
  email: string;
  role: "staff" | "admin";
  isActive: boolean;
  createdAt: string;
}

export interface Student {
  id: number;
  studentId: string;
  fullName: string;
  email?: string;
  tutorGroup?: string;
  createdAt: string;
}

export interface Device {
  id: number;
  assetNumber: string;
  barcode: string;
  qrCode?: string;
  status: "available" | "reserved" | "checked_out" | "maintenance" | "retired";
  make?: string;
  model?: string;
  serialNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Loan {
  id: number;
  student: Student;
  device?: Device;
  loanType: "day_loan" | "extended" | "repair";
  status: "reserved" | "checked_out" | "returned" | "cancelled";
  reason?: string;
  reservedAt: string;
  checkedOutAt?: string;
  returnedAt?: string;
  dueAt: string;
  notes?: string;
  isOverdue?: boolean;
}

export interface DashboardStats {
  available: number;
  checkedOut: number;
  maintenance: number;
  reserved: number;
  overdue: number;
}
