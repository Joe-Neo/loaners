import { Router, Request, Response } from "express";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { Staff } from "../entities/Staff";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const staffRepo = AppDataSource.getRepository(Staff);
    const staff = await staffRepo.findOne({ where: [{ username }, { email: username }] });
    if (!staff || !staff.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, staff.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: staff.id, email: staff.email, role: staff.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "8h" }
    );
    res.json({ data: { token, staff: { id: staff.id, username: staff.username, email: staff.email, role: staff.role } } });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const staffRepo = AppDataSource.getRepository(Staff);
    const staff = await staffRepo.findOne({ where: { id: req.user!.id } });
    if (!staff) return res.status(404).json({ error: "Not found" });
    res.json({ data: { id: staff.id, username: staff.username, email: staff.email, role: staff.role } });
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;
