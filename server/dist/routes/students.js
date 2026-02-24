"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../data-source");
const Student_1 = require("../entities/Student");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
// Look up student by student_id (barcode scan) or search by name/email
router.get("/lookup", async (req, res) => {
    const { studentId, query } = req.query;
    const repo = data_source_1.AppDataSource.getRepository(Student_1.Student);
    if (studentId) {
        const student = await repo.findOne({ where: { studentId } });
        if (!student)
            return res.status(404).json({ error: "Student not found" });
        return res.json({ data: student });
    }
    if (query) {
        const students = await repo.find({
            where: [
                { fullName: (0, typeorm_1.Like)(`%${query}%`) },
                { email: (0, typeorm_1.Like)(`%${query}%`) },
                { studentId: (0, typeorm_1.Like)(`%${query}%`) },
            ],
            take: 10,
        });
        return res.json({ data: students });
    }
    res.status(400).json({ error: "Provide studentId or query parameter" });
});
// Upsert student (from QR scan or manual entry)
router.post("/", async (req, res) => {
    const { studentId, fullName, email, tutorGroup } = req.body;
    if (!studentId || !fullName) {
        return res.status(400).json({ error: "studentId and fullName are required" });
    }
    const repo = data_source_1.AppDataSource.getRepository(Student_1.Student);
    let student = await repo.findOne({ where: { studentId } });
    if (student) {
        // Update fields if provided
        if (fullName)
            student.fullName = fullName;
        if (email)
            student.email = email;
        if (tutorGroup)
            student.tutorGroup = tutorGroup;
        await repo.save(student);
    }
    else {
        student = repo.create({ studentId, fullName, email, tutorGroup });
        await repo.save(student);
    }
    res.json({ data: student });
});
exports.default = router;
