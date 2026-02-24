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
    { studentId: "STU001", fullName: "Alice Johnson", email: "alice@school.edu", tutorGroup: "10A" },
    { studentId: "STU002", fullName: "Bob Smith", email: "bob@school.edu", tutorGroup: "10B" },
    { studentId: "STU003", fullName: "Charlie Brown", email: "charlie@school.edu", tutorGroup: "11A" },
  ];
  for (const s of sampleStudents) {
    const exists = await studentRepo.findOne({ where: { studentId: s.studentId } });
    if (!exists) {
      await studentRepo.save(studentRepo.create(s));
    }
  }
  console.log("Created 3 sample students");

  await AppDataSource.destroy();
  console.log("Seed complete.");
}

seed().catch(console.error);
