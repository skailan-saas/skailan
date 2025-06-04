"use server";

import { Prisma, ProductType as PrismaProductType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  ProductFormSchema,
  type ProductFormValues,
} from "@/lib/schemas/crm/product-schema";
import { getCurrentUserWithTenant } from "@/lib/session";

// Frontend Product type, might differ slightly from PrismaProduct for UI needs
export interface ProductFE {
  id: string;
  tenantId: string;
  name: string;
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
  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error("No tenant found - please check your domain configuration");
    }
    const productsFromDb = await prisma.product.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return productsFromDb.map((p) => ({
      ...p,
      price: Number(p.price), // Convert Decimal to number
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

export async function getProductsForSelect(): Promise<
  { id: string; name: string; type: PrismaProductType; price: number }[]
> {
  try {
    console.log(
      "getProductsForSelect: Iniciando obtención de productos para select..."
    );

    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      console.error(
        "getProductsForSelect: No se pudo obtener el tenant actual"
      );
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    const productsFromDb = await prisma.product.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        isActive: true, // Only active products for selection
      },
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
      },
      orderBy: { name: "asc" },
    });

    return productsFromDb.map((p) => ({
      ...p,
      price: Number(p.price), // Convert Decimal to number
    }));
  } catch (error) {
    console.error("Prisma error in getProductsForSelect:", error);
    throw new Error(
      "Could not fetch products for selection. Database operation failed."
    );
  }
}

export async function createProduct(
  data: ProductFormValues
): Promise<ProductFE> {
  console.log("createProduct: Iniciando creación de producto con datos:", data);

  const validation = ProductFormSchema.safeParse(data);
  if (!validation.success) {
    console.error(
      "createProduct: Validación fallida:",
      validation.error.flatten().fieldErrors
    );
    throw new Error(
      `Invalid product data: ${JSON.stringify(
        validation.error.flatten().fieldErrors
      )}`
    );
  }

  const { name, type, description, price, sku, category, isActive } =
    validation.data;

  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      console.error("createProduct: No se pudo obtener el tenant actual");
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    console.log("createProduct: Tenant obtenido:", {
      id: user.tenantId,
      name: user.tenantName,
    });
    console.log("createProduct: Datos del producto procesados:", {
      name,
      type,
      description,
      price,
      sku,
      category,
      isActive,
    });

    const newProduct = await prisma.product.create({
      data: {
        tenantId: user.tenantId,
        name,
        type,
        description: description || null,
        price,
        sku: sku || null,
        category: category || null,
        isActive,
      },
    });

    console.log("createProduct: Producto creado exitosamente:", newProduct.id);

    revalidatePath("/crm/products");
    return {
      ...newProduct,
      price: Number(newProduct.price), // Convert Decimal to number
      description: newProduct.description ?? undefined,
      sku: newProduct.sku ?? undefined,
      category: newProduct.category ?? undefined,
      deletedAt: newProduct.deletedAt ?? undefined,
    };
  } catch (error) {
    console.error("createProduct: Error completo:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        error.code === "P2002" &&
        (error.meta?.target as string[])?.includes("sku") &&
        (error.meta?.target as string[])?.includes("tenantId")
      ) {
        throw new Error(
          "A product with this SKU already exists for this tenant."
        );
      }
    }
    throw new Error("Could not create product. Database operation failed.");
  }
}

export async function updateProduct(
  id: string,
  data: ProductFormValues
): Promise<ProductFE> {
  console.log("updateProduct: Iniciando actualización de producto:", {
    id,
    data,
  });

  const validation = ProductFormSchema.safeParse(data);
  if (!validation.success) {
    console.error(
      "updateProduct: Validación fallida:",
      validation.error.flatten().fieldErrors
    );
    throw new Error(
      `Invalid product data: ${JSON.stringify(
        validation.error.flatten().fieldErrors
      )}`
    );
  }
  const { name, type, description, price, sku, category, isActive } =
    validation.data;

  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      console.error("updateProduct: No se pudo obtener el tenant actual");
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    console.log("updateProduct: Tenant obtenido:", {
      id: user.tenantId,
      name: user.tenantName,
    });

    const updatedProduct = await prisma.product.update({
      where: { id, tenantId: user.tenantId, deletedAt: null },
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

    console.log(
      "updateProduct: Producto actualizado exitosamente:",
      updatedProduct.id
    );

    revalidatePath("/crm/products");
    return {
      ...updatedProduct,
      price: Number(updatedProduct.price), // Convert Decimal to number
      description: updatedProduct.description ?? undefined,
      sku: updatedProduct.sku ?? undefined,
      category: updatedProduct.category ?? undefined,
      deletedAt: updatedProduct.deletedAt ?? undefined,
    };
  } catch (error) {
    console.error(`updateProduct: Error para ID ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error(`Product with ID ${id} not found or has been deleted.`);
      }
      if (
        error.code === "P2002" &&
        (error.meta?.target as string[])?.includes("sku") &&
        (error.meta?.target as string[])?.includes("tenantId")
      ) {
        throw new Error(
          "A product with this SKU already exists for this tenant."
        );
      }
    }
    throw new Error("Could not update product. Database operation failed.");
  }
}

export async function deleteProduct(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("deleteProduct: Iniciando eliminación de producto:", id);

    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      console.error("deleteProduct: No se pudo obtener el tenant actual");
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    await prisma.product.update({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    console.log("deleteProduct: Producto eliminado exitosamente:", id);

    revalidatePath("/crm/products");
    return { success: true };
  } catch (error) {
    console.error(`deleteProduct: Error para ID ${id}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        message: `Product with ID ${id} not found or already deleted.`,
      };
    }
    return {
      success: false,
      message: "Could not delete product. Database operation failed.",
    };
  }
}
