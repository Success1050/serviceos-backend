import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<string>('MAIL_USE_SSL') === 'true',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendStaffTemporaryPassword(
    to: string,
    firstName: string,
    tempPassword: string,
    companyName: string
  ) {
    const from = this.configService.get<string>('MAIL_FROM');
    
    // HTML Template
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
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      // Still log it out so it's not lost if email fails
      this.logger.log(`[FALLBACK] Temp password for ${to} is: ${tempPassword}`);
      throw error;
    }
  }

  async sendInternalTicketAlert(to: string, branchName: string, ticketTitle: string) {
    const from = this.configService.get<string>('MAIL_FROM');
    
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
    } catch (error) {
      this.logger.error(`Failed to send ticket alert email to ${to}`, error.stack);
    }
  }
}
