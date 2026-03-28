import { isNull } from "drizzle-orm";
import {
  type AnyPgColumn,
  index,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { materialTypeEnum, metadata, pk } from "./_helpers";
import { locationsTable } from "./location";

// ─── UOM (Unit of Measure) ────────────────────────────────────────────────────

export const uomsTable = pgTable("uoms", { ...pk, code: text().notNull(), ...metadata }, (t) => [
  uniqueIndex("uoms_code_idx").on(t.code).where(isNull(t.deletedAt)),
]);

// ─── Material Categories ──────────────────────────────────────────────────────

export const materialCategoriesTable = pgTable(
  "material_categories",
  {
    ...pk,
    name: text().notNull(),
    description: text(),
    parentId: uuid().references((): AnyPgColumn => materialCategoriesTable.id, { onDelete: "set null" }),
    ...metadata,
  },
  (t) => [uniqueIndex("material_categories_name_idx").on(t.name).where(isNull(t.deletedAt))],
);

// ─── Materials ────────────────────────────────────────────────────────────────

export const materialsTable = pgTable(
  "materials",
  {
    ...pk,
    name: text().notNull(),
    description: text(),
    sku: text().notNull(),
    type: materialTypeEnum().notNull(),
    categoryId: uuid().references(() => materialCategoriesTable.id, { onDelete: "set null" }),
    baseUomId: uuid()
      .notNull()
      .references(() => uomsTable.id, { onDelete: "restrict" }),
    ...metadata,
  },
  (t) => [
    uniqueIndex("materials_name_idx").on(t.name).where(isNull(t.deletedAt)),
    uniqueIndex("materials_sku_idx").on(t.sku).where(isNull(t.deletedAt)),
    index("materials_category_idx").on(t.categoryId),
    index("materials_base_uom_idx").on(t.baseUomId),
  ],
);

// ─── Material Conversions ─────────────────────────────────────────────────────
// MongoDB embedded `material.conversions[]` → proper table in SQL.
// Stores UOM conversion factors relative to the material's base UOM.

export const materialConversionsTable = pgTable(
  "material_conversions",
  {
    ...pk,
    materialId: uuid()
      .notNull()
      .references(() => materialsTable.id, { onDelete: "cascade" }),
    uomId: uuid()
      .notNull()
      .references(() => uomsTable.id, { onDelete: "restrict" }),
    toBaseFactor: numeric({ precision: 18, scale: 6 }).notNull(),
    ...metadata,
  },
  (t) => [
    uniqueIndex("material_conversions_material_uom_idx")
      .on(t.materialId, t.uomId)
      .where(isNull(t.deletedAt)),
    index("material_conversions_uom_idx").on(t.uomId),
  ],
);

// ─── Material Locations ───────────────────────────────────────────────────────
// Junction between materials and locations with per-location config + stock snapshot.

export const materialLocationsTable = pgTable(
  "material_locations",
  {
    ...pk,
    materialId: uuid()
      .notNull()
      .references(() => materialsTable.id, { onDelete: "cascade" }),
    locationId: uuid()
      .notNull()
      .references(() => locationsTable.id, { onDelete: "restrict" }),

    // Per-location configuration
    minStock: numeric({ precision: 18, scale: 4 }).notNull().default("0"),
    maxStock: numeric({ precision: 18, scale: 4 }),
    reorderPoint: numeric({ precision: 18, scale: 4 }).notNull().default("0"),

    // Current stock snapshot (maintained by inventory module)
    currentQty: numeric({ precision: 18, scale: 4 }).notNull().default("0"),
    currentAvgCost: numeric({ precision: 18, scale: 4 }).notNull().default("0"),
    currentValue: numeric({ precision: 18, scale: 4 }).notNull().default("0"),

    ...metadata,
  },
  (t) => [
    uniqueIndex("material_locations_material_location_idx")
      .on(t.materialId, t.locationId)
      .where(isNull(t.deletedAt)),
    index("material_locations_location_idx").on(t.locationId),
  ],
);
