import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum DeviceStatus {
  AVAILABLE = "available",
  RESERVED = "reserved",
  CHECKED_OUT = "checked_out",
  MAINTENANCE = "maintenance",
  RETIRED = "retired",
}

@Entity("devices")
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "asset_number", unique: true })
  assetNumber: string;

  @Column({ unique: true })
  barcode: string;

  @Column({ name: "qr_code", unique: true, nullable: true })
  qrCode: string;

  @Column({
    type: "enum",
    enum: DeviceStatus,
    default: DeviceStatus.AVAILABLE,
  })
  status: DeviceStatus;

  @Column({ nullable: true })
  make: string;

  @Column({ nullable: true })
  model: string;

  @Column({ name: "serial_number", nullable: true })
  serialNumber: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
