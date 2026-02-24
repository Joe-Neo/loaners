import { Router, Response } from "express";
import * as bcrypt from "bcrypt";
import { AppDataSource } from "../data-source";
import { Staff, StaffRole } from "../entities/Staff";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { requireAdmin } from "../middleware/roleGuard";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/", async (_req: AuthRequest, res: Response) => {
  const repo = AppDataSource.getRepository(Staff);
  const staff = await repo.find({ order: { createdAt: "DESC" } });
  res.json({ data: staff.map(s => ({ id: s.id, username: s.username, email: s.email, role: s.role, isActive: s.isActive, createdAt: s.createdAt })) });
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email, and password are required" });
  }
  const repo = AppDataSource.getRepository(Staff);
  const existing = await repo.findOne({ where: [{ username }, { email }] });
  if (existing) return res.status(409).json({ error: "Username or email already exists" });
  const passwordHash = await bcrypt.hash(password, 10);
  const staff = repo.create({ username, email, passwordHash, role: role || StaffRole.STAFF });
  await repo.save(staff);
  res.status(201).json({ data: { id: staff.id, username: staff.username, email: staff.email, role: staff.role } });
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  const repo = AppDataSource.getRepository(Staff);
  const staff = await repo.findOne({ where: { id: parseInt(req.params.id) } });
  if (!staff) return res.status(404).json({ error: "Not found" });
  const { username, email, password, role, isActive } = req.body;
  if (username) staff.username = username;
  if (email) staff.email = email;
  if (password) staff.passwordHash = await bcrypt.hash(password, 10);
  if (role) staff.role = role;
  if (isActive !== undefined) staff.isActive = isActive;
  await repo.save(staff);
  res.json({ data: { id: staff.id, username: staff.username, email: staff.email, role: staff.role, isActive: staff.isActive } });
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const repo = AppDataSource.getRepository(Staff);
  const staff = await repo.findOne({ where: { id: parseInt(req.params.id) } });
  if (!staff) return res.status(404).json({ error: "Not found" });
  staff.isActive = false;
  await repo.save(staff);
  res.json({ data: { message: "Staff deactivated" } });
});

export default router;
