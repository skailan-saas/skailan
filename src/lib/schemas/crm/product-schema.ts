
import { z } from 'zod';
import { ProductType as PrismaProductType } from '@prisma/client';

// Define ProductType enum matching Prisma for validation
export const ProductTypeEnum = z.enum([PrismaProductType.PRODUCTO, PrismaProductType.SERVICIO]);

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
