import { SQL } from 'bun';
const sql = new SQL(process.env.DATABASE_URL!);
try {
  const result = await sql`
      SELECT "materialId", SUM("closingQty") as total_qty
      FROM (
        SELECT DISTINCT ON ("materialId", "locationId") "materialId", "closingQty"
        FROM stock_summaries
        WHERE "materialId" = ANY(ARRAY[1]::int[]) AND "deletedAt" IS NULL
        ORDER BY "materialId", "locationId", "date" DESC
      ) latest
      GROUP BY "materialId"
  `;
  console.log(result);
} catch (e) {
  console.log("bun:sql error:", e.message);
}
sql.close();
