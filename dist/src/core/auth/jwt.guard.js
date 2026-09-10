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
exports.JwtGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const jose_1 = require("jose");
const public_decorator_1 = require("../decorators/public.decorator");
let JwtGuard = class JwtGuard {
    reflector;
    configService;
    jwtSecret;
    constructor(reflector, configService) {
        this.reflector = reflector;
        this.configService = configService;
        const secretStr = this.configService.get('JWT_SECRET') || 'super-secret-key-for-dev-only-do-not-use-in-prod';
        this.jwtSecret = new TextEncoder().encode(secretStr);
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new common_1.UnauthorizedException('Authentication token is missing');
        }
        try {
            const { payload } = await (0, jose_1.jwtVerify)(token, this.jwtSecret);
            request.user = {
                id: payload.sub,
                email: payload.email,
                tenantId: payload.tenantId,
                permissions: payload.permissions || [],
                directPermissions: payload.directPermissions || [],
                relationshipId: payload.relationshipId,
                phone: payload.phone,
            };
        }
        catch (err) {
            throw new common_1.UnauthorizedException('Invalid or expired authentication token');
        }
        return true;
    }
    extractTokenFromHeader(request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
};
exports.JwtGuard = JwtGuard;
exports.JwtGuard = JwtGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        config_1.ConfigService])
], JwtGuard);
//# sourceMappingURL=jwt.guard.js.map