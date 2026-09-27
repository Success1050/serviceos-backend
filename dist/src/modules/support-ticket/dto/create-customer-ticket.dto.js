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
exports.CreateCustomerTicketDto = exports.DisputeReasonEnum = exports.TicketPriorityEnum = exports.SupportTicketTypeEnum = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var SupportTicketTypeEnum;
(function (SupportTicketTypeEnum) {
    SupportTicketTypeEnum["WARRANTY_CLAIM"] = "WARRANTY_CLAIM";
    SupportTicketTypeEnum["BILLING_DISPUTE"] = "BILLING_DISPUTE";
    SupportTicketTypeEnum["SERVICE_COMPLAINT"] = "SERVICE_COMPLAINT";
    SupportTicketTypeEnum["GENERAL_INQUIRY"] = "GENERAL_INQUIRY";
})(SupportTicketTypeEnum || (exports.SupportTicketTypeEnum = SupportTicketTypeEnum = {}));
var TicketPriorityEnum;
(function (TicketPriorityEnum) {
    TicketPriorityEnum["LOW"] = "LOW";
    TicketPriorityEnum["NORMAL"] = "NORMAL";
    TicketPriorityEnum["HIGH"] = "HIGH";
    TicketPriorityEnum["URGENT"] = "URGENT";
})(TicketPriorityEnum || (exports.TicketPriorityEnum = TicketPriorityEnum = {}));
var DisputeReasonEnum;
(function (DisputeReasonEnum) {
    DisputeReasonEnum["OVERCHARGED"] = "OVERCHARGED";
    DisputeReasonEnum["UNAUTHORIZED_FEE"] = "UNAUTHORIZED_FEE";
    DisputeReasonEnum["WORK_NOT_COMPLETED"] = "WORK_NOT_COMPLETED";
    DisputeReasonEnum["POOR_WORKMANSHIP"] = "POOR_WORKMANSHIP";
    DisputeReasonEnum["DOUBLE_CHARGED"] = "DOUBLE_CHARGED";
    DisputeReasonEnum["WARRANTY_DENIAL"] = "WARRANTY_DENIAL";
    DisputeReasonEnum["OTHER"] = "OTHER";
})(DisputeReasonEnum || (exports.DisputeReasonEnum = DisputeReasonEnum = {}));
class CreateCustomerTicketDto {
    subject;
    description;
    type;
    priority;
    attachments;
    assetId;
    invoiceId;
    paymentTransactionId;
    jobId;
    disputedAmount;
    disputeReason;
}
exports.CreateCustomerTicketDto = CreateCustomerTicketDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCustomerTicketDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCustomerTicketDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SupportTicketTypeEnum),
    __metadata("design:type", String)
], CreateCustomerTicketDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TicketPriorityEnum),
    __metadata("design:type", String)
], CreateCustomerTicketDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateCustomerTicketDto.prototype, "attachments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCustomerTicketDto.prototype, "assetId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCustomerTicketDto.prototype, "invoiceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCustomerTicketDto.prototype, "paymentTransactionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCustomerTicketDto.prototype, "jobId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCustomerTicketDto.prototype, "disputedAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(DisputeReasonEnum),
    __metadata("design:type", String)
], CreateCustomerTicketDto.prototype, "disputeReason", void 0);
//# sourceMappingURL=create-customer-ticket.dto.js.map