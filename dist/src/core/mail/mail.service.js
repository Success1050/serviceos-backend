"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
const config_1 = require("@nestjs/config");
let MailService = MailService_1 = class MailService {
    configService;
    transporter;
    logger = new common_1.Logger(MailService_1.name);
    constructor(configService) {
        this.configService = configService;
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST'),
            port: this.configService.get('MAIL_PORT'),
            secure: this.configService.get('MAIL_USE_SSL') === 'true',
            auth: {
                user: this.configService.get('MAIL_USER'),
                pass: this.configService.get('MAIL_PASSWORD'),
            },
        });
    }
    async sendStaffTemporaryPassword(to, firstName, tempPassword, companyName) {
        const from = this.configService.get('MAIL_FROM');
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ${companyName}, ${firstName}!</h2>
        <p>Your staff account has been officially approved by HQ.</p>
        <p>Please log in using your temporary password below. You will be required to change it immediately upon your first login.</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0; color: #333; letter-spacing: 2px;">${tempPassword}</h3>
        </div>
        <p>Best regards,<br>The ${companyName} Team</p>
      </div>
    `;
        try {
            await this.transporter.sendMail({
                from,
                to,
                subject: `Your ${companyName} Account has been Approved`,
                html,
            });
            this.logger.log(`Email sent successfully to ${to}`);
            this.logger.debug(`[FOR DEBUGGING] Temp password for ${to} is: ${tempPassword}`);
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error.stack);
            this.logger.log(`[FALLBACK] Temp password for ${to} is: ${tempPassword}`);
            throw error;
        }
    }
    async sendInternalTicketAlert(to, branchName, ticketTitle) {
        const from = this.configService.get('MAIL_FROM');
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Internal Support Ticket</h2>
        <p>Your branch <strong>${branchName}</strong> has submitted a new internal ticket to HQ.</p>
        <p><strong>Subject:</strong> ${ticketTitle}</p>
        <p>Please log in to the HQ dashboard to review and resolve this request.</p>
        <br>
        <p>Best regards,<br>The ServiceOS System</p>
      </div>
    `;
        try {
            await this.transporter.sendMail({
                from,
                to,
                subject: `[HQ Alert] New Ticket from ${branchName}`,
                html,
            });
            this.logger.log(`Internal ticket alert email sent successfully to ${to}`);
        }
        catch (error) {
            this.logger.error(`Failed to send ticket alert email to ${to}`, error.stack);
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map