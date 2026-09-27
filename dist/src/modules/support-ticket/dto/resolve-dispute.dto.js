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
exports.ResolveDisputeDto = exports.DisputeResolutionActionEnum = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var DisputeResolutionActionEnum;
(function (DisputeResolutionActionEnum) {
    DisputeResolutionActionEnum["UPHOLD_CHARGE"] = "UPHOLD_CHARGE";
    DisputeResolutionActionEnum["PARTIAL_CREDIT"] = "PARTIAL_CREDIT";
    DisputeResolutionActionEnum["FULL_REFUND"] = "FULL_REFUND";
    DisputeResolutionActionEnum["VOID_INVOICE"] = "VOID_INVOICE";
})(DisputeResolutionActionEnum || (exports.DisputeResolutionActionEnum = DisputeResolutionActionEnum = {}));
class ResolveDisputeDto {
    action;
    resolutionNotes;
    adjustedAmount;
    executeGatewayRefund = false;
}
exports.ResolveDisputeDto = ResolveDisputeDto;
__decorate([
    (0, class_validator_1.IsEnum)(DisputeResolutionActionEnum),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResolveDisputeDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResolveDisputeDto.prototype, "resolutionNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ResolveDisputeDto.prototype, "adjustedAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResolveDisputeDto.prototype, "executeGatewayRefund", void 0);
//# sourceMappingURL=resolve-dispute.dto.js.map