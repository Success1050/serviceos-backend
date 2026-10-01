import { HttpException, HttpStatus } from '@nestjs/common';
import { ServiceModule } from '@prisma/client';

export class ModuleRestrictedException extends HttpException {
  constructor(missingModule: ServiceModule, customMessage?: string) {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: 'Payment Required',
        message:
          customMessage ||
          `Access to module '${missingModule}' is restricted by your active subscription tier. Please upgrade your plan or contact the platform administrator.`,
        requiredModule: missingModule,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
