"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((req, res, next) => {
        console.log(`[REQ] ${req.method} ${req.originalUrl}`);
        next();
    });
    const configService = app.get(config_1.ConfigService);
    app.enableCors({
        origin: [configService.get('FRONTEND_URL') || 'http://localhost:3001', 'http://localhost:3000'],
        credentials: true,
    });
    await app.listen(configService.get('PORT') ?? 8080);
}
bootstrap();
//# sourceMappingURL=main.js.map