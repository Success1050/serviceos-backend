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
exports.FilterTicketsDto = exports.SupportTicketStatusEnum = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const create_customer_ticket_dto_1 = require("./create-customer-ticket.dto");
var SupportTicketStatusEnum;
(function (SupportTicketStatusEnum) {
    SupportTicketStatusEnum["OPEN"] = "OPEN";
    SupportTicketStatusEnum["IN_PROGRESS"] = "IN_PROGRESS";
    SupportTicketStatusEnum["WAITING_ON_CUSTOMER"] = "WAITING_ON_CUSTOMER";
    SupportTicketStatusEnum["ACTION_REQUIRED"] = "ACTION_REQUIRED";
    SupportTicketStatusEnum["RESOLVED"] = "RESOLVED";
    SupportTicketStatusEnum["CLOSED"] = "CLOSED";
    SupportTicketStatusEnum["REJECTED"] = "REJECTED";
})(SupportTicketStatusEnum || (exports.SupportTicketStatusEnum = SupportTicketStatusEnum = {}));
class FilterTicketsDto {
    status;
    type;
    priority;
    customerRecordId;
    assignedStaffId;
    search;
    page = 1;
    limit = 20;
}
exports.FilterTicketsDto = FilterTicketsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SupportTicketStatusEnum),
    __metadata("design:type", String)
], FilterTicketsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_customer_ticket_dto_1.SupportTicketTypeEnum),
    __metadata("design:type", String)
], FilterTicketsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_customer_ticket_dto_1.TicketPriorityEnum),
    __metadata("design:type", String)
], FilterTicketsDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FilterTicketsDto.prototype, "customerRecordId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FilterTicketsDto.prototype, "assignedStaffId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FilterTicketsDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], FilterTicketsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], FilterTicketsDto.prototype, "limit", void 0);
//# sourceMappingURL=filter-tickets.dto.js.map