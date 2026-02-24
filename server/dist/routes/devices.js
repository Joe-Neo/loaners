"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../data-source");
const Device_1 = require("../entities/Device");
const auth_1 = require("../middleware/auth");
const roleGuard_1 = require("../middleware/roleGuard");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get("/", async (_req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(Device_1.Device);
    const devices = await repo.find({ order: { createdAt: "DESC" } });
    res.json({ data: devices });
});
router.get("/lookup", async (req, res) => {
    const { barcode, qrCode, assetNumber } = req.query;
    const repo = data_source_1.AppDataSource.getRepository(Device_1.Device);
    let device = null;
    if (barcode)
        device = await repo.findOne({ where: { barcode } });
    else if (qrCode)
        device = await repo.findOne({ where: { qrCode } });
    else if (assetNumber)
        device = await repo.findOne({ where: { assetNumber } });
    else
        return res.status(400).json({ error: "Provide barcode, qrCode, or assetNumber" });
    if (!device)
        return res.status(404).json({ error: "Device not found" });
    res.json({ data: device });
});
router.post("/", roleGuard_1.requireAdmin, async (req, res) => {
    const { assetNumber, barcode, qrCode, make, model, serialNumber, notes } = req.body;
    if (!assetNumber || !barcode) {
        return res.status(400).json({ error: "assetNumber and barcode are required" });
    }
    const repo = data_source_1.AppDataSource.getRepository(Device_1.Device);
    const existing = await repo.findOne({ where: [{ assetNumber }, { barcode }] });
    if (existing)
        return res.status(409).json({ error: "Device with this asset number or barcode already exists" });
    const device = repo.create({ assetNumber, barcode, qrCode, make, model, serialNumber, notes });
    await repo.save(device);
    res.status(201).json({ data: device });
});
router.put("/:id", roleGuard_1.requireAdmin, async (req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(Device_1.Device);
    const device = await repo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!device)
        return res.status(404).json({ error: "Not found" });
    const { assetNumber, barcode, qrCode, status, make, model, serialNumber, notes } = req.body;
    if (assetNumber)
        device.assetNumber = assetNumber;
    if (barcode)
        device.barcode = barcode;
    if (qrCode !== undefined)
        device.qrCode = qrCode;
    if (status)
        device.status = status;
    if (make !== undefined)
        device.make = make;
    if (model !== undefined)
        device.model = model;
    if (serialNumber !== undefined)
        device.serialNumber = serialNumber;
    if (notes !== undefined)
        device.notes = notes;
    await repo.save(device);
    res.json({ data: device });
});
exports.default = router;
