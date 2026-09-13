const fs = require('fs');

const path = 'prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

// 1. Add back location fields to User
content = content.replace(
  '  virtualTruck    Warehouse?',
  '  virtualTruck    Warehouse?\n\n  lastKnownLatitude Float?\n  lastKnownLongitude Float?\n  lastLocationUpdate DateTime?'
);

// 2. Add back missing relations to Job
content = content.replace(
  '  quoteId String?',
  '  quoteId String?\n  quote   Quote?  @relation(fields: [quoteId], references: [id], onDelete: SetNull)\n\n  assignedTechnicianId String?\n  assignedTechnician   User?   @relation(fields: [assignedTechnicianId], references: [id], onDelete: SetNull)'
);

// We need to clean up Job. Let's find exactly what is there and replace it correctly.
const jobModelRegex = /model Job \{[\s\S]*?\n\}/;
const correctJobModel = `model Job {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  title       String
  description String?
  status      JobStatus @default(SCHEDULED)

  customerRecordId String
  customerRecord   CustomerRecord @relation(fields: [customerRecordId], references: [id], onDelete: Cascade)

  quoteId String?
  quote   Quote?  @relation(fields: [quoteId], references: [id], onDelete: SetNull)

  assignedTechnicianId String?
  assignedTechnician   User?   @relation(fields: [assignedTechnicianId], references: [id], onDelete: SetNull)

  scheduledAt            DateTime?
  estimatedDuration      Int       @default(60)
  enRouteAt              DateTime?
  startedAt              DateTime?
  completedAt            DateTime?
  completionOtp          String?
  completionOtpExpiresAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  invoices        Invoice[]
  serviceRequests ServiceRequest[]
  expenseReceipts ExpenseReceipt[]

  @@index([tenantId])
}`;

content = content.replace(jobModelRegex, correctJobModel);

fs.writeFileSync(path, content);
console.log("Restored deleted fields to schema.");
