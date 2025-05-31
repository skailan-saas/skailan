
'use server';

import { PrismaClient, type Prisma, ProductType as PrismaProductType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define ProductType enum matching Prisma for validation
const ProductTypeEnum = z.enum([PrismaProductType.PRODUCTO, PrismaProductType.SERVICIO]);

export const ProductFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  type: ProductTypeEnum,
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  sku: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof ProductFormSchema>;

// Frontend Product type, might differ slightly from PrismaProduct for UI needs
export interface ProductFE {
  id: string;
  tenantId: string;
  name:string;
  type: PrismaProductType;
  description?: string | null;
  price: number;
  sku?: string | null;
  category?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  dataAiHint?: string;
}


export async function getProducts(): Promise<ProductFE[]> {
  const tenantIdPlaceholder = "your-tenant-id"; // Replace with actual tenantId logic
  try {
    const productsFromDb = await prisma.product.findMany({
      where: { 
        tenantId: tenantIdPlaceholder,
        deletedAt: null 
      },
      orderBy: { createdAt: 'desc' },
    });
    return productsFromDb.map(p => ({
        ...p,
        description: p.description ?? undefined,
        sku: p.sku ?? undefined,
        category: p.category ?? undefined,
        deletedAt: p.deletedAt ?? undefined,
    }));
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw new Error("Could not fetch products.");
  }
}

export async function createProduct(data: ProductFormValues): Promise<ProductFE> {
  const tenantIdPlaceholder = "your-tenant-id"; // Replace with actual tenantId logic
  const validation = ProductFormSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid product data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }

  const { name, type, description, price, sku, category, isActive } = validation.data;

  try {
    const newProduct = await prisma.product.create({
      data: {
        tenantId: tenantIdPlaceholder,
        name,
        type,
        description: description || null,
        price,
        sku: sku || null,
        category: category || null,
        isActive,
      },
    });
    revalidatePath('/crm/products');
    return {
        ...newProduct,
        description: newProduct.description ?? undefined,
        sku: newProduct.sku ?? undefined,
        category: newProduct.category ?? undefined,
        deletedAt: newProduct.deletedAt ?? undefined,
    };
  } catch (error) {
    console.error("Failed to create product:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('sku') && (error.meta?.target as string[])?.includes('tenantId')) {
             throw new Error("A product with this SKU already exists for this tenant.");
        }
    }
    throw new Error("Could not create product.");
  }
}

export async function updateProduct(id: string, data: ProductFormValues): Promise<ProductFE> {
  const tenantIdPlaceholder = "your-tenant-id"; // Replace with actual tenantId logic
  const validation = ProductFormSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid product data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }
  const { name, type, description, price, sku, category, isActive } = validation.data;

  try {
    const updatedProduct = await prisma.product.update({
      where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
      data: {
        name,
        type,
        description: description || null,
        price,
        sku: sku || null,
        category: category || null,
        isActive,
        updatedAt: new Date(),
      },
    });
    revalidatePath('/crm/products');
    return {
        ...updatedProduct,
        description: updatedProduct.description ?? undefined,
        sku: updatedProduct.sku ?? undefined,
        category: updatedProduct.category ?? undefined,
        deletedAt: updatedProduct.deletedAt ?? undefined,
    };
  } catch (error) {
    console.error(`Failed to update product ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { 
            throw new Error(`Product with ID ${id} not found or has been deleted.`);
        }
        if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('sku') && (error.meta?.target as string[])?.includes('tenantId')) {
             throw new Error("A product with this SKU already exists for this tenant.");
        }
    }
    throw new Error("Could not update product.");
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
  const tenantIdPlaceholder = "your-tenant-id"; // Replace with actual tenantId logic
  try {
    await prisma.product.update({
      where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    revalidatePath('/crm/products');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete product ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return { success: false, message: `Product with ID ${id} not found or already deleted.` };
    }
    return { success: false, message: "Could not delete product." };
  }
}

    