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
require("reflect-metadata");
const bcrypt = __importStar(require("bcrypt"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const data_source_1 = require("./data-source");
const Staff_1 = require("./entities/Staff");
const Device_1 = require("./entities/Device");
const Student_1 = require("./entities/Student");
async function seed() {
    await data_source_1.AppDataSource.initialize();
    const staffRepo = data_source_1.AppDataSource.getRepository(Staff_1.Staff);
    const deviceRepo = data_source_1.AppDataSource.getRepository(Device_1.Device);
    const studentRepo = data_source_1.AppDataSource.getRepository(Student_1.Student);
    // Create admin account (always ensure active)
    const existing = await staffRepo.findOne({ where: { username: "admin" } });
    if (!existing) {
        const admin = staffRepo.create({
            username: "admin",
            email: "admin@school.edu",
            passwordHash: await bcrypt.hash("admin123", 10),
            role: Staff_1.StaffRole.ADMIN,
            isActive: true,
        });
        await staffRepo.save(admin);
        console.log("Created admin account: admin / admin123");
    }
    else {
        await staffRepo.update(existing.id, { isActive: true });
        console.log("Ensured admin account is active");
    }
    // Create sample staff
    const staffExists = await staffRepo.findOne({ where: { username: "staff1" } });
    if (!staffExists) {
        const staff = staffRepo.create({
            username: "staff1",
            email: "staff1@school.edu",
            passwordHash: await bcrypt.hash("staff123", 10),
            role: Staff_1.StaffRole.STAFF,
        });
        await staffRepo.save(staff);
        console.log("Created staff account: staff1 / staff123");
    }
    // Create sample devices
    for (let i = 1; i <= 5; i++) {
        const assetNum = `LT-${String(i).padStart(3, "0")}`;
        const barcode = `BC${String(i).padStart(6, "0")}`;
        const deviceExists = await deviceRepo.findOne({ where: { assetNumber: assetNum } });
        if (!deviceExists) {
            const device = deviceRepo.create({
                assetNumber: assetNum,
                barcode,
                make: "Dell",
                model: "Latitude 5520",
                serialNumber: `SN${String(i).padStart(8, "0")}`,
                status: Device_1.DeviceStatus.AVAILABLE,
            });
            await deviceRepo.save(device);
        }
    }
    console.log("Created 5 sample devices");
    // Create sample students
    const sampleStudents = [
        { studentId: "STU001", fullName: "Alice Johnson", tutorGroup: "10A" },
        { studentId: "STU002", fullName: "Bob Smith", tutorGroup: "10B" },
        { studentId: "STU003", fullName: "Charlie Brown", tutorGroup: "11A" },
        { studentId: "STU004", fullName: "Emma Wilson", tutorGroup: "10A" },
        { studentId: "STU005", fullName: "Liam Patel", tutorGroup: "10B" },
        { studentId: "STU006", fullName: "Sophie Nguyen", tutorGroup: "11A" },
        { studentId: "STU007", fullName: "James Okafor", tutorGroup: "11B" },
        { studentId: "STU008", fullName: "Mia Chen", tutorGroup: "12A" },
        { studentId: "STU009", fullName: "Noah Thompson", tutorGroup: "12B" },
        { studentId: "STU010", fullName: "Isla Mackenzie", tutorGroup: "9A" },
    ];
    for (const s of sampleStudents) {
        const exists = await studentRepo.findOne({ where: { studentId: s.studentId } });
        if (!exists) {
            await studentRepo.save(studentRepo.create(s));
        }
    }
    console.log("Created 10 sample students");
    await data_source_1.AppDataSource.destroy();
    console.log("Seed complete.");
}
seed().catch(console.error);
