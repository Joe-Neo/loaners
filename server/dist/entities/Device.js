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
exports.Device = exports.DeviceStatus = void 0;
const typeorm_1 = require("typeorm");
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus["AVAILABLE"] = "available";
    DeviceStatus["RESERVED"] = "reserved";
    DeviceStatus["CHECKED_OUT"] = "checked_out";
    DeviceStatus["MAINTENANCE"] = "maintenance";
    DeviceStatus["RETIRED"] = "retired";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
let Device = class Device {
};
exports.Device = Device;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Device.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "asset_number", unique: true }),
    __metadata("design:type", String)
], Device.prototype, "assetNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Device.prototype, "barcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "qr_code", unique: true, nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "qrCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: DeviceStatus,
        default: DeviceStatus.AVAILABLE,
    }),
    __metadata("design:type", String)
], Device.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "make", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "serial_number", nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "serialNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Device.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], Device.prototype, "updatedAt", void 0);
exports.Device = Device = __decorate([
    (0, typeorm_1.Entity)("devices")
], Device);
