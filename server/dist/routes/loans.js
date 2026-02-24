"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../data-source");
const Loan_1 = require("../entities/Loan");
const Device_1 = require("../entities/Device");
const Student_1 = require("../entities/Student");
const auth_1 = require("../middleware/auth");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
function endOfDay() {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
}
// POST /api/loans/manual — admin creates a loan directly (walk-in checkout)
router.post("/manual", auth_1.requireAuth, async (req, res) => {
    const { studentId, barcode, qrCode, reason, loanType, dueAt } = req.body;
    if (!studentId)
        return res.status(400).json({ error: "studentId is required" });
    if (!barcode && !qrCode)
        return res.status(400).json({ error: "barcode or qrCode is required" });
    const studentRepo = data_source_1.AppDataSource.getRepository(Student_1.Student);
    const deviceRepo = data_source_1.AppDataSource.getRepository(Device_1.Device);
    const loanRepo = data_source_1.AppDataSource.getRepository(Loan_1.Loan);
    const student = await studentRepo.findOne({ where: { studentId } });
    if (!student)
        return res.status(404).json({ error: "Student not found" });
    const existing = await loanRepo.findOne({
        where: { studentId: student.id, status: (0, typeorm_1.In)([Loan_1.LoanStatus.RESERVED, Loan_1.LoanStatus.CHECKED_OUT]) },
    });
    if (existing)
        return res.status(409).json({ error: "Student already has an active loan or reservation" });
    let device = null;
    if (barcode)
        device = await deviceRepo.findOne({ where: { barcode } });
    else if (qrCode)
        device = await deviceRepo.findOne({ where: { qrCode } });
    if (!device)
        return res.status(404).json({ error: "Device not found" });
    if (device.status !== Device_1.DeviceStatus.AVAILABLE) {
        return res.status(400).json({ error: "Device is not available" });
    }
    const now = new Date();
    const loan = loanRepo.create({
        studentId: student.id,
        deviceId: device.id,
        reason,
        status: Loan_1.LoanStatus.CHECKED_OUT,
        loanType: loanType || Loan_1.LoanType.DAY_LOAN,
        reservedAt: now,
        checkedOutAt: now,
        dueAt: dueAt ? new Date(dueAt) : endOfDay(),
        checkedOutBy: req.user.id,
    });
    await loanRepo.save(loan);
    device.status = Device_1.DeviceStatus.CHECKED_OUT;
    await deviceRepo.save(device);
    const saved = await loanRepo.findOne({ where: { id: loan.id }, relations: ["student", "device"] });
    res.status(201).json({ data: saved });
});
// POST /api/loans/reserve — kiosk creates reservation (no auth needed)
router.post("/reserve", async (req, res) => {
    const { studentId, reason } = req.body;
    if (!studentId) {
        return res.status(400).json({ error: "studentId is required" });
    }
    const studentRepo = data_source_1.AppDataSource.getRepository(Student_1.Student);
    const student = await studentRepo.findOne({ where: { studentId } });
    if (!student)
        return res.status(404).json({ error: "Student not found" });
    // Check for existing active reservation
    const loanRepo = data_source_1.AppDataSource.getRepository(Loan_1.Loan);
    const existing = await loanRepo.findOne({
        where: { studentId: student.id, status: (0, typeorm_1.In)([Loan_1.LoanStatus.RESERVED, Loan_1.LoanStatus.CHECKED_OUT]) },
    });
    if (existing)
        return res.status(409).json({ error: "Student already has an active loan or reservation" });
    const loan = loanRepo.create({
        studentId: student.id,
        reason,
        status: Loan_1.LoanStatus.RESERVED,
        loanType: Loan_1.LoanType.DAY_LOAN,
        reservedAt: new Date(),
        dueAt: endOfDay(),
    });
    await loanRepo.save(loan);
    const saved = await loanRepo.findOne({ where: { id: loan.id }, relations: ["student"] });
    res.status(201).json({ data: saved });
});
// GET /api/loans/reservations — list pending reservations (requires auth)
router.get("/reservations", auth_1.requireAuth, async (_req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(Loan_1.Loan);
    const loans = await repo.find({
        where: { status: Loan_1.LoanStatus.RESERVED },
        relations: ["student"],
        order: { reservedAt: "ASC" },
    });
    res.json({ data: loans });
});
// POST /api/loans/:id/checkout — admin assigns device and checks out
router.post("/:id/checkout", auth_1.requireAuth, async (req, res) => {
    const { barcode, qrCode } = req.body;
    if (!barcode && !qrCode) {
        return res.status(400).json({ error: "barcode or qrCode is required" });
    }
    const loanRepo = data_source_1.AppDataSource.getRepository(Loan_1.Loan);
    const deviceRepo = data_source_1.AppDataSource.getRepository(Device_1.Device);
    const loan = await loanRepo.findOne({ where: { id: parseInt(req.params.id) }, relations: ["student"] });
    if (!loan)
        return res.status(404).json({ error: "Loan not found" });
    if (loan.status !== Loan_1.LoanStatus.RESERVED) {
        return res.status(400).json({ error: "Loan is not in reserved status" });
    }
    let device = null;
    if (barcode)
        device = await deviceRepo.findOne({ where: { barcode } });
    else if (qrCode)
        device = await deviceRepo.findOne({ where: { qrCode } });
    if (!device)
        return res.status(404).json({ error: "Device not found" });
    if (device.status !== Device_1.DeviceStatus.AVAILABLE) {
        return res.status(400).json({ error: "Device is not available" });
    }
    loan.deviceId = device.id;
    loan.status = Loan_1.LoanStatus.CHECKED_OUT;
    loan.checkedOutAt = new Date();
    loan.checkedOutBy = req.user.id;
    device.status = Device_1.DeviceStatus.CHECKED_OUT;
    await loanRepo.save(loan);
    await deviceRepo.save(device);
    const updated = await loanRepo.findOne({ where: { id: loan.id }, relations: ["student", "device"] });
    res.json({ data: updated });
});
// POST /api/loans/checkin — admin scans device to check in
router.post("/checkin", auth_1.requireAuth, async (req, res) => {
    const { barcode, qrCode } = req.body;
    if (!barcode && !qrCode) {
        return res.status(400).json({ error: "barcode or qrCode is required" });
    }
    const deviceRepo = data_source_1.AppDataSource.getRepository(Device_1.Device);
    const loanRepo = data_source_1.AppDataSource.getRepository(Loan_1.Loan);
    let device = null;
    if (barcode)
        device = await deviceRepo.findOne({ where: { barcode } });
    else if (qrCode)
        device = await deviceRepo.findOne({ where: { qrCode } });
    if (!device)
        return res.status(404).json({ error: "Device not found" });
    const loan = await loanRepo.findOne({
        where: { deviceId: device.id, status: Loan_1.LoanStatus.CHECKED_OUT },
        relations: ["student", "device"],
    });
    if (!loan)
        return res.status(404).json({ error: "No active loan found for this device" });
    loan.status = Loan_1.LoanStatus.RETURNED;
    loan.returnedAt = new Date();
    loan.returnedTo = req.user.id;
    device.status = Device_1.DeviceStatus.AVAILABLE;
    await loanRepo.save(loan);
    await deviceRepo.save(device);
    res.json({ data: loan });
});
// GET /api/loans/active — all active loans
router.get("/active", auth_1.requireAuth, async (_req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(Loan_1.Loan);
    const loans = await repo.find({
        where: { status: (0, typeorm_1.In)([Loan_1.LoanStatus.RESERVED, Loan_1.LoanStatus.CHECKED_OUT]) },
        relations: ["student", "device"],
        order: { reservedAt: "ASC" },
    });
    const now = new Date();
    const result = loans.map((l) => ({
        ...l,
        isOverdue: l.status === Loan_1.LoanStatus.CHECKED_OUT && l.dueAt < now,
    }));
    res.json({ data: result });
});
// GET /api/loans/export — download all loans as CSV
router.get("/export", auth_1.requireAuth, async (_req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(Loan_1.Loan);
    const loans = await repo.find({
        relations: ["student", "device"],
        order: { createdAt: "DESC" },
    });
    const escape = (v) => {
        if (v == null)
            return "";
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
router.get("/history", auth_1.requireAuth, async (req, res) => {
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "25");
    const repo = data_source_1.AppDataSource.getRepository(Loan_1.Loan);
    const [loans, total] = await repo.findAndCount({
        relations: ["student", "device"],
        order: { createdAt: "DESC" },
        skip: (page - 1) * limit,
        take: limit,
    });
    res.json({ data: loans, total, page, limit });
});
// GET /api/loans/:id
router.get("/:id", auth_1.requireAuth, async (req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(Loan_1.Loan);
    const loan = await repo.findOne({ where: { id: parseInt(req.params.id) }, relations: ["student", "device"] });
    if (!loan)
        return res.status(404).json({ error: "Not found" });
    res.json({ data: loan });
});
// PUT /api/loans/:id — admin updates loan details
router.put("/:id", auth_1.requireAuth, async (req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(Loan_1.Loan);
    const loan = await repo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!loan)
        return res.status(404).json({ error: "Not found" });
    const { loanType, dueAt, notes, status } = req.body;
    if (loanType)
        loan.loanType = loanType;
    if (dueAt)
        loan.dueAt = new Date(dueAt);
    if (notes !== undefined)
        loan.notes = notes;
    if (status)
        loan.status = status;
    await repo.save(loan);
    res.json({ data: loan });
});
// DELETE /api/loans/:id — cancel
router.delete("/:id", auth_1.requireAuth, async (req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(Loan_1.Loan);
    const loan = await repo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!loan)
        return res.status(404).json({ error: "Not found" });
    loan.status = Loan_1.LoanStatus.CANCELLED;
    await repo.save(loan);
    res.json({ data: { message: "Loan cancelled" } });
});
exports.default = router;
