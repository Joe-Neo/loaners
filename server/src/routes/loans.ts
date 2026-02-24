import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Loan, LoanStatus, LoanType } from "../entities/Loan";
import { Device, DeviceStatus } from "../entities/Device";
import { Student } from "../entities/Student";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { IsNull, Not, In } from "typeorm";

const router = Router();

function endOfDay(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

// POST /api/loans/manual — admin creates a loan directly (walk-in checkout)
router.post("/manual", requireAuth, async (req: AuthRequest, res: Response) => {
  const { studentId, barcode, qrCode, reason, loanType, dueAt } = req.body;
  if (!studentId) return res.status(400).json({ error: "studentId is required" });
  if (!barcode && !qrCode) return res.status(400).json({ error: "barcode or qrCode is required" });

  const studentRepo = AppDataSource.getRepository(Student);
  const deviceRepo = AppDataSource.getRepository(Device);
  const loanRepo = AppDataSource.getRepository(Loan);

  const student = await studentRepo.findOne({ where: { studentId } });
  if (!student) return res.status(404).json({ error: "Student not found" });

  const existing = await loanRepo.findOne({
    where: { studentId: student.id, status: In([LoanStatus.RESERVED, LoanStatus.CHECKED_OUT]) },
  });
  if (existing) return res.status(409).json({ error: "Student already has an active loan or reservation" });

  let device = null;
  if (barcode) device = await deviceRepo.findOne({ where: { barcode } });
  else if (qrCode) device = await deviceRepo.findOne({ where: { qrCode } });
  if (!device) return res.status(404).json({ error: "Device not found" });
  if (device.status !== DeviceStatus.AVAILABLE) {
    return res.status(400).json({ error: "Device is not available" });
  }

  const now = new Date();
  const loan = loanRepo.create({
    studentId: student.id,
    deviceId: device.id,
    reason,
    status: LoanStatus.CHECKED_OUT,
    loanType: loanType || LoanType.DAY_LOAN,
    reservedAt: now,
    checkedOutAt: now,
    dueAt: dueAt ? new Date(dueAt) : endOfDay(),
    checkedOutBy: req.user!.id,
  });
  await loanRepo.save(loan);
  device.status = DeviceStatus.CHECKED_OUT;
  await deviceRepo.save(device);

  const saved = await loanRepo.findOne({ where: { id: loan.id }, relations: ["student", "device"] });
  res.status(201).json({ data: saved });
});

// POST /api/loans/reserve — kiosk creates reservation (no auth needed)
router.post("/reserve", async (req: Request, res: Response) => {
  const { studentId, reason } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "studentId is required" });
  }
  const studentRepo = AppDataSource.getRepository(Student);
  const student = await studentRepo.findOne({ where: { studentId } });
  if (!student) return res.status(404).json({ error: "Student not found" });

  // Check for existing active reservation
  const loanRepo = AppDataSource.getRepository(Loan);
  const existing = await loanRepo.findOne({
    where: { studentId: student.id, status: In([LoanStatus.RESERVED, LoanStatus.CHECKED_OUT]) },
  });
  if (existing) return res.status(409).json({ error: "Student already has an active loan or reservation" });

  const loan = loanRepo.create({
    studentId: student.id,
    reason,
    status: LoanStatus.RESERVED,
    loanType: LoanType.DAY_LOAN,
    reservedAt: new Date(),
    dueAt: endOfDay(),
  });
  await loanRepo.save(loan);
  const saved = await loanRepo.findOne({ where: { id: loan.id }, relations: ["student"] });
  res.status(201).json({ data: saved });
});

// GET /api/loans/reservations — list pending reservations (requires auth)
router.get("/reservations", requireAuth, async (_req: AuthRequest, res: Response) => {
  const repo = AppDataSource.getRepository(Loan);
  const loans = await repo.find({
    where: { status: LoanStatus.RESERVED },
    relations: ["student"],
    order: { reservedAt: "ASC" },
  });
  res.json({ data: loans });
});

// POST /api/loans/:id/checkout — admin assigns device and checks out
router.post("/:id/checkout", requireAuth, async (req: AuthRequest, res: Response) => {
  const { barcode, qrCode } = req.body;
  if (!barcode && !qrCode) {
    return res.status(400).json({ error: "barcode or qrCode is required" });
  }
  const loanRepo = AppDataSource.getRepository(Loan);
  const deviceRepo = AppDataSource.getRepository(Device);

  const loan = await loanRepo.findOne({ where: { id: parseInt(req.params.id) }, relations: ["student"] });
  if (!loan) return res.status(404).json({ error: "Loan not found" });
  if (loan.status !== LoanStatus.RESERVED) {
    return res.status(400).json({ error: "Loan is not in reserved status" });
  }

  let device = null;
  if (barcode) device = await deviceRepo.findOne({ where: { barcode } });
  else if (qrCode) device = await deviceRepo.findOne({ where: { qrCode } });
  if (!device) return res.status(404).json({ error: "Device not found" });
  if (device.status !== DeviceStatus.AVAILABLE) {
    return res.status(400).json({ error: "Device is not available" });
  }

  loan.deviceId = device.id;
  loan.status = LoanStatus.CHECKED_OUT;
  loan.checkedOutAt = new Date();
  loan.checkedOutBy = req.user!.id;
  device.status = DeviceStatus.CHECKED_OUT;

  await loanRepo.save(loan);
  await deviceRepo.save(device);

  const updated = await loanRepo.findOne({ where: { id: loan.id }, relations: ["student", "device"] });
  res.json({ data: updated });
});

// POST /api/loans/checkin — admin scans device to check in
router.post("/checkin", requireAuth, async (req: AuthRequest, res: Response) => {
  const { barcode, qrCode } = req.body;
  if (!barcode && !qrCode) {
    return res.status(400).json({ error: "barcode or qrCode is required" });
  }
  const deviceRepo = AppDataSource.getRepository(Device);
  const loanRepo = AppDataSource.getRepository(Loan);

  let device = null;
  if (barcode) device = await deviceRepo.findOne({ where: { barcode } });
  else if (qrCode) device = await deviceRepo.findOne({ where: { qrCode } });
  if (!device) return res.status(404).json({ error: "Device not found" });

  const loan = await loanRepo.findOne({
    where: { deviceId: device.id, status: LoanStatus.CHECKED_OUT },
    relations: ["student", "device"],
  });
  if (!loan) return res.status(404).json({ error: "No active loan found for this device" });

  loan.status = LoanStatus.RETURNED;
  loan.returnedAt = new Date();
  loan.returnedTo = req.user!.id;
  device.status = DeviceStatus.AVAILABLE;

  await loanRepo.save(loan);
  await deviceRepo.save(device);

  res.json({ data: loan });
});

// GET /api/loans/active — all active loans
router.get("/active", requireAuth, async (_req: AuthRequest, res: Response) => {
  const repo = AppDataSource.getRepository(Loan);
  const loans = await repo.find({
    where: { status: In([LoanStatus.RESERVED, LoanStatus.CHECKED_OUT]) },
    relations: ["student", "device"],
    order: { reservedAt: "ASC" },
  });
  const now = new Date();
  const result = loans.map((l) => ({
    ...l,
    isOverdue: l.status === LoanStatus.CHECKED_OUT && l.dueAt < now,
  }));
  res.json({ data: result });
});

// GET /api/loans/export — download all loans as CSV
router.get("/export", requireAuth, async (_req: AuthRequest, res: Response) => {
  const repo = AppDataSource.getRepository(Loan);
  const loans = await repo.find({
    relations: ["student", "device"],
    order: { createdAt: "DESC" },
  });

  const escape = (v: any) => {
    if (v == null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const header = ["ID", "Student Name", "Student ID", "Device Asset", "Device Barcode", "Loan Type", "Status", "Reason", "Reserved At", "Checked Out At", "Due At", "Returned At", "Notes"];
  const rows = loans.map((l) => [
    l.id,
    l.student?.fullName,
    l.student?.studentId,
    l.device?.assetNumber,
    l.device?.barcode,
    l.loanType,
    l.status,
    l.reason,
    l.reservedAt ? new Date(l.reservedAt).toISOString() : "",
    l.checkedOutAt ? new Date(l.checkedOutAt).toISOString() : "",
    l.dueAt ? new Date(l.dueAt).toISOString() : "",
    l.returnedAt ? new Date(l.returnedAt).toISOString() : "",
    l.notes,
  ].map(escape).join(","));

  const csv = [header.join(","), ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="loans-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

// GET /api/loans/history — all loans paginated
router.get("/history", requireAuth, async (req: AuthRequest, res: Response) => {
  const page = parseInt((req.query.page as string) || "1");
  const limit = parseInt((req.query.limit as string) || "25");
  const repo = AppDataSource.getRepository(Loan);
  const [loans, total] = await repo.findAndCount({
    relations: ["student", "device"],
    order: { createdAt: "DESC" },
    skip: (page - 1) * limit,
    take: limit,
  });
  res.json({ data: loans, total, page, limit });
});

// GET /api/loans/:id
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const repo = AppDataSource.getRepository(Loan);
  const loan = await repo.findOne({ where: { id: parseInt(req.params.id) }, relations: ["student", "device"] });
  if (!loan) return res.status(404).json({ error: "Not found" });
  res.json({ data: loan });
});

// PUT /api/loans/:id — admin updates loan details
router.put("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const repo = AppDataSource.getRepository(Loan);
  const loan = await repo.findOne({ where: { id: parseInt(req.params.id) } });
  if (!loan) return res.status(404).json({ error: "Not found" });
  const { loanType, dueAt, notes, status } = req.body;
  if (loanType) loan.loanType = loanType;
  if (dueAt) loan.dueAt = new Date(dueAt);
  if (notes !== undefined) loan.notes = notes;
  if (status) loan.status = status;
  await repo.save(loan);
  res.json({ data: loan });
});

// DELETE /api/loans/:id — cancel
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const repo = AppDataSource.getRepository(Loan);
  const loan = await repo.findOne({ where: { id: parseInt(req.params.id) } });
  if (!loan) return res.status(404).json({ error: "Not found" });
  loan.status = LoanStatus.CANCELLED;
  await repo.save(loan);
  res.json({ data: { message: "Loan cancelled" } });
});

export default router;
