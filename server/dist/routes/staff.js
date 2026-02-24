"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt = __importStar(require("bcrypt"));
const data_source_1 = require("../data-source");
const Staff_1 = require("../entities/Staff");
const auth_1 = require("../middleware/auth");
const roleGuard_1 = require("../middleware/roleGuard");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth, roleGuard_1.requireAdmin);
router.get("/", async (_req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(Staff_1.Staff);
    const staff = await repo.find({ order: { createdAt: "DESC" } });
    res.json({ data: staff.map(s => ({ id: s.id, username: s.username, email: s.email, role: s.role, isActive: s.isActive, createdAt: s.createdAt })) });
});
router.post("/", async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: "username, email, and password are required" });
    }
    const repo = data_source_1.AppDataSource.getRepository(Staff_1.Staff);
    const existing = await repo.findOne({ where: [{ username }, { email }] });
    if (existing)
        return res.status(409).json({ error: "Username or email already exists" });
    const passwordHash = await bcrypt.hash(password, 10);
    const staff = repo.create({ username, email, passwordHash, role: role || Staff_1.StaffRole.STAFF });
    await repo.save(staff);
    res.status(201).json({ data: { id: staff.id, username: staff.username, email: staff.email, role: staff.role } });
});
router.put("/:id", async (req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(Staff_1.Staff);
    const staff = await repo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!staff)
        return res.status(404).json({ error: "Not found" });
    const { username, email, password, role, isActive } = req.body;
    if (username)
        staff.username = username;
    if (email)
        staff.email = email;
    if (password)
        staff.passwordHash = await bcrypt.hash(password, 10);
    if (role)
        staff.role = role;
    if (isActive !== undefined)
        staff.isActive = isActive;
    await repo.save(staff);
    res.json({ data: { id: staff.id, username: staff.username, email: staff.email, role: staff.role, isActive: staff.isActive } });
});
router.delete("/:id", async (req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(Staff_1.Staff);
    const staff = await repo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!staff)
        return res.status(404).json({ error: "Not found" });
    staff.isActive = false;
    await repo.save(staff);
    res.json({ data: { message: "Staff deactivated" } });
});
exports.default = router;
