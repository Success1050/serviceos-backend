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
exports.FilterTechniciansDto = exports.ProxyVerificationStatusEnum = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var ProxyVerificationStatusEnum;
(function (ProxyVerificationStatusEnum) {
    ProxyVerificationStatusEnum["NOT_REQUIRED"] = "NOT_REQUIRED";
    ProxyVerificationStatusEnum["PENDING_HQ_REVIEW"] = "PENDING_HQ_REVIEW";
    ProxyVerificationStatusEnum["APPROVED"] = "APPROVED";
    ProxyVerificationStatusEnum["REJECTED"] = "REJECTED";
})(ProxyVerificationStatusEnum || (exports.ProxyVerificationStatusEnum = ProxyVerificationStatusEnum = {}));
class FilterTechniciansDto {
    search;
    proxyVerificationStatus;
    termsAcknowledged;
    departmentId;
    page = 1;
    limit = 20;
}
exports.FilterTechniciansDto = FilterTechniciansDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FilterTechniciansDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ProxyVerificationStatusEnum),
    __metadata("design:type", String)
], FilterTechniciansDto.prototype, "proxyVerificationStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FilterTechniciansDto.prototype, "termsAcknowledged", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FilterTechniciansDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], FilterTechniciansDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], FilterTechniciansDto.prototype, "limit", void 0);
//# sourceMappingURL=filter-technicians.dto.js.map