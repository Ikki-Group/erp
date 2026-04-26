import fs from 'fs';
import path from 'path';

function replaceMath(content) {
  // Simple regex replacements for specific known patterns in those files
  // e.g. Number(item.qty) -> new Decimal(item.qty)
  content = content.replace(/Number\((item\.qty|data\.shippingCost|item\.unitCost|item\.discountAmount|item\.taxAmount)\)/g, 'new Decimal($1)');
  content = content.replace(/Number\(([^)]+)\)/g, 'new Decimal($1)');

  // This is too crude, let's just do targeted replacements for the files
  return content;
}

// We will just read the files, do simple replace for known Number(...) to new Decimal(...) 
// and then fix the arithmetic manually if needed. Actually it's easier to use a targeted script.

const files = [
  'src/modules/inventory/service/stock/stock-internal-movement.service.ts',
  'src/modules/inventory/service/stock/stock-external-movement.service.ts',
  'src/modules/purchasing/service/goods-receipt.service.ts',
  'src/modules/material/service/material-location.service.ts',
  'src/modules/recipe/repo/recipe.repo.ts'
];

for (const file of files) {
  const filePath = path.resolve('./', file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // We need to add `import Decimal from 'decimal.js'` if not present
  if (!content.includes("import Decimal from 'decimal.js'") && !content.includes('import { Decimal }')) {
    content = content.replace(/import { db } from '@\/db'/, "import { db } from '@/db'\nimport Decimal from 'decimal.js'");
  }

  // specific fixes for stock-internal-movement
  content = content.replace(/const totalCost = qty \* currentAvgCost/g, "const totalCost = new Decimal(qty).mul(currentAvgCost)");
  content = content.replace(/qty \* currentAvgCost/g, "new Decimal(qty).mul(currentAvgCost)");

  // replace all Number(x) with new Decimal(x)
  // But wait! Number() was already removed by my previous script `fix-number.js`!
  // Ah! Because I removed `Number()`, now it's just doing `qty * currentAvgCost` where `qty` is a string!
  // That's why TS is complaining about `Operator '<' cannot be applied to types 'string' and 'number'`.

  fs.writeFileSync(filePath, content);
}
