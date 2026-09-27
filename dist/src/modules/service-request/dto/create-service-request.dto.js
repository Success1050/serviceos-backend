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
exports.CreateServiceRequestDto = exports.UrgencyLevelDto = void 0;
const class_validator_1 = require("class-validator");
var UrgencyLevelDto;
(function (UrgencyLevelDto) {
    UrgencyLevelDto["LOW"] = "LOW";
    UrgencyLevelDto["NORMAL"] = "NORMAL";
    UrgencyLevelDto["URGENT"] = "URGENT";
    UrgencyLevelDto["EMERGENCY"] = "EMERGENCY";
})(UrgencyLevelDto || (exports.UrgencyLevelDto = UrgencyLevelDto = {}));
class CreateServiceRequestDto {
    description;
    assetId;
    urgency;
    preferredDate;
    preferredTimeSlot;
    attachments;
}
exports.CreateServiceRequestDto = CreateServiceRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "assetId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(UrgencyLevelDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "urgency", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "preferredDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "preferredTimeSlot", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateServiceRequestDto.prototype, "attachments", void 0);
//# sourceMappingURL=create-service-request.dto.js.map