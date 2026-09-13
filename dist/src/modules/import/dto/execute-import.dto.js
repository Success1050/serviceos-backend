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
exports.ExecuteImportDto = exports.DuplicateRule = void 0;
const class_validator_1 = require("class-validator");
var DuplicateRule;
(function (DuplicateRule) {
    DuplicateRule["SKIP"] = "SKIP";
    DuplicateRule["UPDATE"] = "UPDATE";
    DuplicateRule["CREATE_NEW"] = "CREATE_NEW";
})(DuplicateRule || (exports.DuplicateRule = DuplicateRule = {}));
class ExecuteImportDto {
    rows;
    mapping;
    duplicateRule;
}
exports.ExecuteImportDto = ExecuteImportDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], ExecuteImportDto.prototype, "rows", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], ExecuteImportDto.prototype, "mapping", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(DuplicateRule),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExecuteImportDto.prototype, "duplicateRule", void 0);
//# sourceMappingURL=execute-import.dto.js.map