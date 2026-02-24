import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

@Entity("students")
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "student_id", unique: true })
  studentId: string;

  @Column({ name: "full_name" })
  fullName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: "tutor_group", nullable: true })
  tutorGroup: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
