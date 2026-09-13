const fs = require('fs');

const path = 'prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

// 1. Add relations to Tenant
content = content.replace(
  'roles                 Role[]',
  'roles                 Role[]\n  productCatalogs       ProductCatalog[]\n  warehouses            Warehouse[]\n  equipmentRequests     EquipmentRequest[]\n  expenseReceipts       ExpenseReceipt[]'
);

// 2. Add relations to User
content = content.replace(
  'internalTickets InternalTicket[]',
  'internalTickets InternalTicket[]\n  virtualTruck    Warehouse?\n  expenseReceipts ExpenseReceipt[]'
);

// 3. Add fields to Job
content = content.replace(
  'scheduledAt          DateTime?',
  'scheduledAt          DateTime?\n  estimatedDuration    Int            @default(60)\n  enRouteAt            DateTime?'
);

content = content.replace(
  'completedAt          DateTime?',
  'completedAt          DateTime?\n  completionOtp          String?\n  completionOtpExpiresAt DateTime?'
);

content = content.replace(
  'serviceRequests      ServiceRequest[]',
  'serviceRequests      ServiceRequest[]\n  expenseReceipts      ExpenseReceipt[]'
);

// 4. Append Stage 23 models
const appendStr = `

// ------------------------------------------------------
// STAGE 23: INVENTORY & EXPENSES
// ------------------------------------------------------

model ProductCatalog {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  name        String
  sku         String?
  price       Decimal?

  inventoryItems   InventoryItem[]
  equipmentRequests EquipmentRequest[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
}

enum WarehouseType {
  HQ_WAREHOUSE
  VIRTUAL_TRUCK
}

model Warehouse {
  id                   String        @id @default(uuid())
  tenantId             String
  tenant               Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  name                 String
  type                 WarehouseType @default(HQ_WAREHOUSE)

  assignedTechnicianId String?       @unique
  assignedTechnician   User?         @relation(fields: [assignedTechnicianId], references: [id], onDelete: SetNull)

  inventoryItems       InventoryItem[]
  equipmentRequests    EquipmentRequest[] // Requests sent to this warehouse

  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  @@index([tenantId])
}

model InventoryItem {
  id          String         @id @default(uuid())
  warehouseId String
  warehouse   Warehouse      @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  
  productId   String
  product     ProductCatalog @relation(fields: [productId], references: [id], onDelete: Restrict)
  
  quantity    Int            @default(0)

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@unique([warehouseId, productId])
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
  FULFILLED
}

model EquipmentRequest {
  id            String         @id @default(uuid())
  tenantId      String
  tenant        Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  hqWarehouseId String
  hqWarehouse   Warehouse      @relation(fields: [hqWarehouseId], references: [id], onDelete: Cascade)

  productId     String
  product       ProductCatalog @relation(fields: [productId], references: [id], onDelete: Restrict)
  
  quantity      Int

  status        RequestStatus  @default(PENDING)

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([tenantId])
}

enum ExpenseStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
}

model ExpenseReceipt {
  id             String        @id @default(uuid())
  tenantId       String
  tenant         Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  jobId          String
  job            Job           @relation(fields: [jobId], references: [id], onDelete: Cascade)

  technicianId   String
  technician     User          @relation(fields: [technicianId], references: [id], onDelete: Cascade)

  amount         Decimal
  receiptPhotoUrl String
  
  status         ExpenseStatus @default(PENDING_APPROVAL)

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([tenantId])
}
`;

fs.writeFileSync(path, content + appendStr);
console.log("Schema patched successfully.");
