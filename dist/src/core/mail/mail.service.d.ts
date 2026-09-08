import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private configService;
    private transporter;
    private readonly logger;
    constructor(configService: ConfigService);
    sendStaffTemporaryPassword(to: string, firstName: string, tempPassword: string, companyName: string): Promise<void>;
    sendInternalTicketAlert(to: string, branchName: string, ticketTitle: string): Promise<void>;
}
