import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Student } from "./Student";
import { Device } from "./Device";
import { Staff } from "./Staff";

export enum LoanType {
  DAY_LOAN = "day_loan",
  EXTENDED = "extended",
  REPAIR = "repair",
}

export enum LoanStatus {
  RESERVED = "reserved",
  CHECKED_OUT = "checked_out",
  RETURNED = "returned",
  CANCELLED = "cancelled",
}

@Entity("loans")
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student)
  @JoinColumn({ name: "student_id" })
  student: Student;

  @Column({ name: "student_id" })
  studentId: number;

  @ManyToOne(() => Device, { nullable: true })
  @JoinColumn({ name: "device_id" })
  device: Device;

  @Column({ name: "device_id", nullable: true })
  deviceId: number;

  @Column({
    name: "loan_type",
    type: "enum",
    enum: LoanType,
    default: LoanType.DAY_LOAN,
  })
  loanType: LoanType;

  @Column({
    type: "enum",
    enum: LoanStatus,
    default: LoanStatus.RESERVED,
  })
  status: LoanStatus;

  @Column({ nullable: true })
  reason: string;

  @Column({ name: "reserved_at", type: "timestamp" })
  reservedAt: Date;

  @Column({ name: "checked_out_at", type: "timestamp", nullable: true })
  checkedOutAt: Date;

  @Column({ name: "returned_at", type: "timestamp", nullable: true })
  returnedAt: Date;

  @Column({ name: "due_at", type: "timestamp" })
  dueAt: Date;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: "checked_out_by" })
  checkedOutByStaff: Staff;

  @Column({ name: "checked_out_by", nullable: true })
  checkedOutBy: number;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: "returned_to" })
  returnedToStaff: Staff;

  @Column({ name: "returned_to", nullable: true })
  returnedTo: number;

  @Column({ type: "text", nullable: true })
  notes: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
