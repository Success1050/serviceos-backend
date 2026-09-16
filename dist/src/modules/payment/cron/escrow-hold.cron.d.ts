import { PrismaService } from '../../../core/prisma/prisma.service';
import { PaymentService } from '../payment.service';
export declare class EscrowHoldCronService {
    private readonly prisma;
    private readonly paymentService;
    private readonly logger;
    constructor(prisma: PrismaService, paymentService: PaymentService);
    scanUpcomingJobsForPreArrivalHold(): Promise<void>;
    scanLongTermJobsForRollingReauthorization(): Promise<void>;
}
