/**
 * Product Types
 * Type definitions for Product domain
 */

export type ProductStatus = "active" | "inactive" | "discontinued";
export type ProductCategory = "raw-material" | "semi-finished" | "finished-goods" | "consumable";
export type ProductUnit = "kg" | "liter" | "pcs" | "box" | "meter" | "roll";

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: ProductCategory;
  status: ProductStatus;
  unit: ProductUnit;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  supplier?: string;
  barcode?: string;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  imageUrl?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface ProductFormData {
  code: string;
  name: string;
  description?: string;
  category: ProductCategory;
  status: ProductStatus;
  unit: ProductUnit;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  supplier?: string;
  barcode?: string;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags?: string[];
}

export interface ProductFilters {
  search?: string;
  category?: ProductCategory;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}
