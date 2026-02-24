"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loan = exports.LoanStatus = exports.LoanType = void 0;
const typeorm_1 = require("typeorm");
const Student_1 = require("./Student");
const Device_1 = require("./Device");
const Staff_1 = require("./Staff");
var LoanType;
(function (LoanType) {
    LoanType["DAY_LOAN"] = "day_loan";
    LoanType["EXTENDED"] = "extended";
    LoanType["REPAIR"] = "repair";
})(LoanType || (exports.LoanType = LoanType = {}));
var LoanStatus;
(function (LoanStatus) {
    LoanStatus["RESERVED"] = "reserved";
    LoanStatus["CHECKED_OUT"] = "checked_out";
    LoanStatus["RETURNED"] = "returned";
    LoanStatus["CANCELLED"] = "cancelled";
})(LoanStatus || (exports.LoanStatus = LoanStatus = {}));
let Loan = class Loan {
};
exports.Loan = Loan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Loan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Student_1.Student),
    (0, typeorm_1.JoinColumn)({ name: "student_id" }),
    __metadata("design:type", Student_1.Student)
], Loan.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "student_id" }),
    __metadata("design:type", Number)
], Loan.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Device_1.Device, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "device_id" }),
    __metadata("design:type", Device_1.Device)
], Loan.prototype, "device", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "device_id", nullable: true }),
    __metadata("design:type", Number)
], Loan.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "loan_type",
        type: "enum",
        enum: LoanType,
        default: LoanType.DAY_LOAN,
    }),
    __metadata("design:type", String)
], Loan.prototype, "loanType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: LoanStatus,
        default: LoanStatus.RESERVED,
    }),
    __metadata("design:type", String)
], Loan.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Loan.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "reserved_at", type: "timestamp" }),
    __metadata("design:type", Date)
], Loan.prototype, "reservedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "checked_out_at", type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Loan.prototype, "checkedOutAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "returned_at", type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Loan.prototype, "returnedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "due_at", type: "timestamp" }),
    __metadata("design:type", Date)
], Loan.prototype, "dueAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Staff_1.Staff, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "checked_out_by" }),
    __metadata("design:type", Staff_1.Staff)
], Loan.prototype, "checkedOutByStaff", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "checked_out_by", nullable: true }),
    __metadata("design:type", Number)
], Loan.prototype, "checkedOutBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Staff_1.Staff, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "returned_to" }),
    __metadata("design:type", Staff_1.Staff)
], Loan.prototype, "returnedToStaff", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "returned_to", nullable: true }),
    __metadata("design:type", Number)
], Loan.prototype, "returnedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Loan.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Loan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], Loan.prototype, "updatedAt", void 0);
exports.Loan = Loan = __decorate([
    (0, typeorm_1.Entity)("loans")
], Loan);
