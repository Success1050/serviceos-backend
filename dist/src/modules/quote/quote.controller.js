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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteController = void 0;
const common_1 = require("@nestjs/common");
const quote_service_1 = require("./quote.service");
const create_quote_dto_1 = require("./dto/create-quote.dto");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../core/decorators/permissions.decorator");
let QuoteController = class QuoteController {
    quoteService;
    constructor(quoteService) {
        this.quoteService = quoteService;
    }
    async create(user, createQuoteDto) {
        if (!user.tenantId) {
            throw new common_1.BadRequestException('User does not belong to a tenant');
        }
        return this.quoteService.createQuote(user.tenantId, createQuoteDto);
    }
    async findAll(user) {
        if (!user.tenantId) {
            throw new common_1.BadRequestException('User does not belong to a tenant');
        }
        return this.quoteService.getQuotes(user.tenantId);
    }
    async send(user, quoteId) {
        if (!user.tenantId) {
            throw new common_1.BadRequestException('User does not belong to a tenant');
        }
        return this.quoteService.sendQuote(user.tenantId, quoteId);
    }
};
exports.QuoteController = QuoteController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_quote_dto_1.CreateQuoteDto]),
    __metadata("design:returntype", Promise)
], QuoteController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuoteController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, permissions_decorator_1.Permissions)('admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], QuoteController.prototype, "send", null);
exports.QuoteController = QuoteController = __decorate([
    (0, common_1.Controller)('quotes'),
    __metadata("design:paramtypes", [quote_service_1.QuoteService])
], QuoteController);
//# sourceMappingURL=quote.controller.js.map