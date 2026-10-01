import { SetMetadata } from '@nestjs/common';
import { ServiceModule } from '@prisma/client';

export const REQUIRE_MODULE_KEY = 'require_module';
export const RequireModule = (...modules: ServiceModule[]) =>
  SetMetadata(REQUIRE_MODULE_KEY, modules);
