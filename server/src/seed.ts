import "reflect-metadata";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";
dotenv.config();
import { AppDataSource } from "./data-source";
import { Staff, StaffRole } from "./entities/Staff";
import { Device, DeviceStatus } from "./entities/Device";
import { Student } from "./entities/Student";

async function seed() {
  await AppDataSource.initialize();
  const staffRepo = AppDataSource.getRepository(Staff);
  const deviceRepo = AppDataSource.getRepository(Device);
  const studentRepo = AppDataSource.getRepository(Student);

  // Create admin account
  const existing = await staffRepo.findOne({ where: { username: "admin" } });
  if (!existing) {
    const admin = staffRepo.create({
      username: "admin",
      email: "admin@school.edu",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: StaffRole.ADMIN,
    });
    await staffRepo.save(admin);
    console.log("Created admin account: admin / admin123");
  }

  // Create sample staff
  const staffExists = await staffRepo.findOne({ where: { username: "staff1" } });
  if (!staffExists) {
    const staff = staffRepo.create({
      username: "staff1",
      email: "staff1@school.edu",
      passwordHash: await bcrypt.hash("staff123", 10),
      role: StaffRole.STAFF,
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
        status: DeviceStatus.AVAILABLE,
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

  await AppDataSource.destroy();
  console.log("Seed complete.");
}

seed().catch(console.error);
