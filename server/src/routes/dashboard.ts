import { Router, Response } from "express";
import { AppDataSource } from "../data-source";
import { Device, DeviceStatus } from "../entities/Device";
import { Loan, LoanStatus } from "../entities/Loan";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { requireAdmin } from "../middleware/roleGuard";
import { In } from "typeorm";

const router = Router();
router.use(requireAuth);

router.get("/stats", async (_req: AuthRequest, res: Response) => {
  const deviceRepo = AppDataSource.getRepository(Device);
  const loanRepo = AppDataSource.getRepository(Loan);

  const [available, checkedOut, maintenance, reserved] = await Promise.all([
    deviceRepo.count({ where: { status: DeviceStatus.AVAILABLE } }),
    deviceRepo.count({ where: { status: DeviceStatus.CHECKED_OUT } }),
    deviceRepo.count({ where: { status: DeviceStatus.MAINTENANCE } }),
    loanRepo.count({ where: { status: LoanStatus.RESERVED } }),
  ]);

  const now = new Date();
  const overdue = await loanRepo
    .createQueryBuilder("loan")
    .where("loan.status = :status", { status: LoanStatus.CHECKED_OUT })
    .andWhere("loan.due_at < :now", { now })
    .getCount();

  res.json({ data: { available, checkedOut, maintenance, reserved, overdue } });
});

router.post("/reset", requireAdmin, async (_req: AuthRequest, res: Response) => {
  const loanRepo = AppDataSource.getRepository(Loan);
  const deviceRepo = AppDataSource.getRepository(Device);

  await loanRepo.delete({});
  await deviceRepo
    .createQueryBuilder()
    .update(Device)
    .set({ status: DeviceStatus.AVAILABLE })
    .where("status IN (:...statuses)", {
      statuses: [DeviceStatus.CHECKED_OUT, DeviceStatus.RESERVED],
    })
    .execute();

  res.json({ data: { message: "Data reset successfully" } });
});

export default router;
