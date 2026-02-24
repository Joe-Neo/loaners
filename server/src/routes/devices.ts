import { Router, Response } from "express";
import { AppDataSource } from "../data-source";
import { Device, DeviceStatus } from "../entities/Device";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { requireAdmin } from "../middleware/roleGuard";

const router = Router();

// No auth — kiosk needs this without a session
router.get("/available-count", async (_req, res: Response) => {
  const repo = AppDataSource.getRepository(Device);
  const available = await repo.count({ where: { status: DeviceStatus.AVAILABLE } });
  res.json({ available });
});

router.use(requireAuth);

router.get("/", async (_req: AuthRequest, res: Response) => {
  const repo = AppDataSource.getRepository(Device);
  const devices = await repo.find({ order: { createdAt: "DESC" } });
  res.json({ data: devices });
});

router.get("/lookup", async (req: AuthRequest, res: Response) => {
  const { barcode, qrCode, assetNumber } = req.query as any;
  const repo = AppDataSource.getRepository(Device);
  let device = null;
  if (barcode) device = await repo.findOne({ where: { barcode } });
  else if (qrCode) device = await repo.findOne({ where: { qrCode } });
  else if (assetNumber) device = await repo.findOne({ where: { assetNumber } });
  else return res.status(400).json({ error: "Provide barcode, qrCode, or assetNumber" });
  if (!device) return res.status(404).json({ error: "Device not found" });
  res.json({ data: device });
});

router.post("/", requireAdmin, async (req: AuthRequest, res: Response) => {
  const { assetNumber, barcode, qrCode, make, model, serialNumber, notes } = req.body;
  if (!assetNumber || !barcode) {
    return res.status(400).json({ error: "assetNumber and barcode are required" });
  }
  const repo = AppDataSource.getRepository(Device);
  const existing = await repo.findOne({ where: [{ assetNumber }, { barcode }] });
  if (existing) return res.status(409).json({ error: "Device with this asset number or barcode already exists" });
  const device = repo.create({ assetNumber, barcode, qrCode, make, model, serialNumber, notes });
  await repo.save(device);
  res.status(201).json({ data: device });
});

router.put("/:id", requireAdmin, async (req: AuthRequest, res: Response) => {
  const repo = AppDataSource.getRepository(Device);
  const device = await repo.findOne({ where: { id: parseInt(req.params.id) } });
  if (!device) return res.status(404).json({ error: "Not found" });
  const { assetNumber, barcode, qrCode, status, make, model, serialNumber, notes } = req.body;
  if (assetNumber) device.assetNumber = assetNumber;
  if (barcode) device.barcode = barcode;
  if (qrCode !== undefined) device.qrCode = qrCode;
  if (status) device.status = status;
  if (make !== undefined) device.make = make;
  if (model !== undefined) device.model = model;
  if (serialNumber !== undefined) device.serialNumber = serialNumber;
  if (notes !== undefined) device.notes = notes;
  await repo.save(device);
  res.json({ data: device });
});

export default router;
