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

  async sendTechnicianAssignedCustomerEmail(params: {
    to: string;
    customerName: string;
    companyName: string;
    jobTitle: string;
    scheduledAt: string;
    technicianName: string;
    technicianPhone?: string;
    portalUrl: string;
  }) {
    const from = this.configService.get<string>('MAIL_FROM');
    const { to, customerName, companyName, jobTitle, scheduledAt, technicianName, technicianPhone, portalUrl } = params;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #006937; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">${companyName}</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Field Service Appointment Confirmation</p>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <p style="font-size: 15px; margin-top: 0;">Good day <strong>${customerName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            A certified field technician has been dispatched to your service request for <strong>${jobTitle}</strong>.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 140px;">📅 Scheduled Visit:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${scheduledAt}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">👷 Assigned Engineer:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #006937;">Engr. ${technicianName}</td>
              </tr>
              ${technicianPhone ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b;">📞 Direct Phone:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a;"><a href="tel:${technicianPhone}" style="color: #006937; text-decoration: none;">${technicianPhone}</a></td>
              </tr>` : ''}
              <tr>
                <td style="padding: 6px 0; color: #64748b;">📋 Service Scope:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${jobTitle}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 28px 0 16px;">
            <a href="${portalUrl}" style="background: #006937; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
              View Live Tracking & Details in Portal &rarr;
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            Need to reschedule? Please reach out to your contractor dispatch hotline or reply directly to this notice.
          </p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `Technician Assigned: ${jobTitle} — ${companyName}`,
        html,
      });
      this.logger.log(`Technician assignment email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send technician assignment email to ${to}: ${error.message}`);
      // Console fallback for local development preview
      console.log(`[EMAIL DISPATCH TO ${to}] Subject: Technician Assigned: ${jobTitle} — ${companyName} | Tech: ${technicianName} | Time: ${scheduledAt}`);
    }
  }

  async sendQuoteEmail(params: {
    to: string;
    customerName: string;
    companyName: string;
    quoteTitle: string;
    amount: string | number;
    portalUrl: string;
    validUntil?: string;
  }) {
    const from = this.configService.get<string>('MAIL_FROM');
    const { to, customerName, companyName, quoteTitle, amount, portalUrl, validUntil } = params;

    const formattedAmount =
      typeof amount === 'number'
        ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)
        : String(amount);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #006937; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">${companyName}</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Official Commercial Proposal & Quote</p>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <p style="font-size: 15px; margin-top: 0;">Hello <strong>${customerName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            A new commercial proposal has been prepared for you by <strong>${companyName}</strong>.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 140px;">📋 Proposal Scope:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${quoteTitle}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">💰 Total Value:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #006937; font-size: 16px;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">⏳ Quote Validity:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #d97706;">${validUntil || '14 Days from issue'}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 28px 0 16px;">
            <a href="${portalUrl}" style="background: #006937; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
              Review & Sign Quote Online &rarr;
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            Questions regarding this proposal? Please reach out to ${companyName} directly or reply to this notice.
          </p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `Commercial Proposal: ${quoteTitle} — ${companyName}`,
        html,
      });
      this.logger.log(`Quote proposal email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send quote email to ${to}: ${error.message}`);
      console.log(`[EMAIL DISPATCH TO ${to}] Subject: Commercial Proposal: ${quoteTitle} — ${companyName} | Amount: ${formattedAmount}`);
    }
  }
}

