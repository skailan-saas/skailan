
'use server';

import { PrismaClient, type Prisma, ProductType as PrismaProductType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { ProductFormSchema, type ProductFormValues } from '@/lib/schemas/crm/product-schema';

const prisma = new PrismaClient();

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
  // IMPORTANT: Replace with actual tenantId from user session or context
  const tenantIdPlaceholder = "your-tenant-id";
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
    console.error("Prisma error in getProducts:", error);
    throw new Error("Could not fetch products. Database operation failed.");
  }
}

export async function getProductsForSelect(): Promise<{ id: string; name: string; type: PrismaProductType; price: number }[]> {
  // IMPORTANT: Replace with actual tenantId from user session or context
  const tenantIdPlaceholder = "your-tenant-id";
  try {
    const productsFromDb = await prisma.product.findMany({
      where: {
        tenantId: tenantIdPlaceholder,
        deletedAt: null,
        isActive: true, // Only active products for selection
      },
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
      },
      orderBy: { name: 'asc' },
    });
    return productsFromDb;
  } catch (error) {
    console.error("Prisma error in getProductsForSelect:", error);
    throw new Error("Could not fetch products for selection. Database operation failed.");
  }
}


export async function createProduct(data: ProductFormValues): Promise<ProductFE> {
  // IMPORTANT: Replace with actual tenantId from user session or context
  const tenantIdPlaceholder = "your-tenant-id";
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
    console.error("Prisma error in createProduct:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('sku') && (error.meta?.target as string[])?.includes('tenantId')) {
             throw new Error("A product with this SKU already exists for this tenant.");
        }
    }
    throw new Error("Could not create product. Database operation failed.");
  }
}

export async function updateProduct(id: string, data: ProductFormValues): Promise<ProductFE> {
  // IMPORTANT: Replace with actual tenantId from user session or context
  const tenantIdPlaceholder = "your-tenant-id";
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
    console.error(`Prisma error in updateProduct for ID ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            throw new Error(`Product with ID ${id} not found or has been deleted.`);
        }
        if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('sku') && (error.meta?.target as string[])?.includes('tenantId')) {
             throw new Error("A product with this SKU already exists for this tenant.");
        }
    }
    throw new Error("Could not update product. Database operation failed.");
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
  // IMPORTANT: Replace with actual tenantId from user session or context
  const tenantIdPlaceholder = "your-tenant-id";
  try {
    await prisma.product.update({
      where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    revalidatePath('/crm/products');
    return { success: true };
  } catch (error) {
    console.error(`Prisma error in deleteProduct for ID ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return { success: false, message: `Product with ID ${id} not found or already deleted.` };
    }
    return { success: false, message: "Could not delete product. Database operation failed." };
  }
}

