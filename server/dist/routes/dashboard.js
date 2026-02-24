"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../data-source");
const Device_1 = require("../entities/Device");
const Loan_1 = require("../entities/Loan");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get("/stats", async (_req, res) => {
    const deviceRepo = data_source_1.AppDataSource.getRepository(Device_1.Device);
    const loanRepo = data_source_1.AppDataSource.getRepository(Loan_1.Loan);
    const [available, checkedOut, maintenance, reserved] = await Promise.all([
        deviceRepo.count({ where: { status: Device_1.DeviceStatus.AVAILABLE } }),
        deviceRepo.count({ where: { status: Device_1.DeviceStatus.CHECKED_OUT } }),
        deviceRepo.count({ where: { status: Device_1.DeviceStatus.MAINTENANCE } }),
        loanRepo.count({ where: { status: Loan_1.LoanStatus.RESERVED } }),
    ]);
    const now = new Date();
    const overdue = await loanRepo
        .createQueryBuilder("loan")
        .where("loan.status = :status", { status: Loan_1.LoanStatus.CHECKED_OUT })
        .andWhere("loan.due_at < :now", { now })
        .getCount();
    res.json({ data: { available, checkedOut, maintenance, reserved, overdue } });
});
exports.default = router;
