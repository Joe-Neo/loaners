import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Student } from "../entities/Student";
import { Like } from "typeorm";

const router = Router();

// Look up student by student_id (barcode scan) or search by name/email
router.get("/lookup", async (req: Request, res: Response) => {
  const { studentId, query } = req.query as { studentId?: string; query?: string };
  const repo = AppDataSource.getRepository(Student);

  if (studentId) {
    const student = await repo.findOne({ where: { studentId } });
    if (!student) return res.status(404).json({ error: "Student not found" });
    return res.json({ data: student });
  }

  if (query) {
    const students = await repo.find({
      where: [
        { fullName: Like(`%${query}%`) },
        { email: Like(`%${query}%`) },
        { studentId: Like(`%${query}%`) },
      ],
      take: 10,
    });
    return res.json({ data: students });
  }

  res.status(400).json({ error: "Provide studentId or query parameter" });
});

// Upsert student (from QR scan or manual entry)
router.post("/", async (req: Request, res: Response) => {
  const { studentId, fullName, email, tutorGroup } = req.body;
  if (!studentId || !fullName) {
    return res.status(400).json({ error: "studentId and fullName are required" });
  }
  const repo = AppDataSource.getRepository(Student);
  let student = await repo.findOne({ where: { studentId } });
  if (student) {
    // Update fields if provided
    if (fullName) student.fullName = fullName;
    if (email) student.email = email;
    if (tutorGroup) student.tutorGroup = tutorGroup;
    await repo.save(student);
  } else {
    student = repo.create({ studentId, fullName, email, tutorGroup });
    await repo.save(student);
  }
  res.json({ data: student });
});

export default router;
