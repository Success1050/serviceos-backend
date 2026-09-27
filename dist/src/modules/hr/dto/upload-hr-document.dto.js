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
exports.UploadHrDocumentDto = exports.HrDocumentTypeEnum = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var HrDocumentTypeEnum;
(function (HrDocumentTypeEnum) {
    HrDocumentTypeEnum["NATIONAL_ID"] = "NATIONAL_ID";
    HrDocumentTypeEnum["GOVERNMENT_PHOTO_ID"] = "GOVERNMENT_PHOTO_ID";
    HrDocumentTypeEnum["TECH_LIVE_PHOTO"] = "TECH_LIVE_PHOTO";
    HrDocumentTypeEnum["TRADE_CERTIFICATION"] = "TRADE_CERTIFICATION";
    HrDocumentTypeEnum["RESUME_CV"] = "RESUME_CV";
    HrDocumentTypeEnum["CONTRACT_DISCLOSURE"] = "CONTRACT_DISCLOSURE";
    HrDocumentTypeEnum["OTHER"] = "OTHER";
})(HrDocumentTypeEnum || (exports.HrDocumentTypeEnum = HrDocumentTypeEnum = {}));
class UploadHrDocumentDto {
    documentType;
    fileName;
    fileUrl;
    fileSizeBytes;
    mimeType;
    notes;
}
exports.UploadHrDocumentDto = UploadHrDocumentDto;
__decorate([
    (0, class_validator_1.IsEnum)(HrDocumentTypeEnum),
    __metadata("design:type", String)
], UploadHrDocumentDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadHrDocumentDto.prototype, "fileName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadHrDocumentDto.prototype, "fileUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UploadHrDocumentDto.prototype, "fileSizeBytes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadHrDocumentDto.prototype, "mimeType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadHrDocumentDto.prototype, "notes", void 0);
//# sourceMappingURL=upload-hr-document.dto.js.map