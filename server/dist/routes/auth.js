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
const jwt = __importStar(require("jsonwebtoken"));
const data_source_1 = require("../data-source");
const Staff_1 = require("../entities/Staff");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }
        const staffRepo = data_source_1.AppDataSource.getRepository(Staff_1.Staff);
        const staff = await staffRepo.findOne({ where: [{ username }, { email: username }] });
        if (!staff || !staff.isActive) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const valid = await bcrypt.compare(password, staff.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = jwt.sign({ id: staff.id, email: staff.email, role: staff.role }, process.env.JWT_SECRET || "secret", { expiresIn: "8h" });
        res.json({ data: { token, staff: { id: staff.id, username: staff.username, email: staff.email, role: staff.role } } });
    }
    catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});
router.get("/me", auth_1.requireAuth, async (req, res) => {
    try {
        const staffRepo = data_source_1.AppDataSource.getRepository(Staff_1.Staff);
        const staff = await staffRepo.findOne({ where: { id: req.user.id } });
        if (!staff)
            return res.status(404).json({ error: "Not found" });
        res.json({ data: { id: staff.id, username: staff.username, email: staff.email, role: staff.role } });
    }
    catch {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});
exports.default = router;
