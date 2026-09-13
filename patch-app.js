const fs = require('fs');

const path = 'src/app.module.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('WarehouseModule')) {
  content = content.replace(
    'import { AppController } from \'./app.controller\';',
    'import { WarehouseModule } from \'./modules/warehouse/warehouse.module\';\nimport { ExpenseModule } from \'./modules/expense/expense.module\';\nimport { AppController } from \'./app.controller\';'
  );

  content = content.replace(
    'NotificationModule,',
    'NotificationModule,\n    WarehouseModule,\n    ExpenseModule,'
  );

  fs.writeFileSync(path, content);
  console.log('AppModule patched successfully');
}
