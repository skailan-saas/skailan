
'use server';
// TODO: CRITICAL - Replace 'your-tenant-id' with actual tenant ID from authenticated user session.
const tenantIdPlaceholder = "your-tenant-id";

import { PrismaClient, type Prisma, type QuoteStatus as PrismaQuoteStatus, type ProductType as PrismaProductType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getLeadsForSelect as getLeadsForSelectFromLeadsModule } from '@/app/(app)/crm/leads/actions';
import { getProductsForSelect as getProductsForSelectFromProductsModule } from '@/app/(app)/crm/products/actions';

const prisma = new PrismaClient();

// Schemas and Types
const QuoteStatusEnum = z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELED"]);

const QuoteLineItemSchema = z.object({
  id: z.string().optional(), // Optional for new items
  productId: z.string().min(1, "Product is required"),
  productName: z.string(), // Included for convenience, but primarily derived from productId
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  // total is calculated: quantity * unitPrice
});

export const QuoteFormSchema = z.object({
  opportunityId: z.string().min(1, "Opportunity (Lead) is required"),
  expiryDate: z.string().optional().nullable(), // Date as string, convert in action
  status: QuoteStatusEnum,
  lineItems: z.array(QuoteLineItemSchema).min(1, "At least one line item is required"),
  notes: z.string().optional().nullable(),
});

export type QuoteLineItemFE = z.infer<typeof QuoteLineItemSchema> & { total: number };
export type QuoteFormValues = z.infer<typeof QuoteFormSchema>;

export interface QuoteFE {
  id: string;
  quoteNumber: string;
  opportunityId: string;
  opportunityName?: string; // Fetched from Lead
  dateCreated: Date;
  expiryDate?: Date | null;
  status: PrismaQuoteStatus;
  lineItems: QuoteLineItemFE[];
  totalAmount: number;
  notes?: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  dataAiHint?: string;
}

// Server Actions
export async function getQuotes(): Promise<QuoteFE[]> {
  const tenantId = tenantIdPlaceholder;
  console.log("Attempting to fetch quotes with tenantId:", tenantId);
  try {
    const quotesFromDb = await prisma.quote.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        opportunity: { select: { name: true } }, // Assuming opportunity is Lead
        lineItems: {
          include: {
            product: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quotesFromDb.map(quote => ({
      ...quote,
      dateCreated: quote.dateCreated,
      opportunityName: quote.opportunity?.name,
      lineItems: quote.lineItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name, // Get product name from included relation
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(), // Convert Decimal to number
        total: (item.quantity * item.unitPrice.toNumber()),
      })),
      totalAmount: quote.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice.toNumber()), 0),
      dataAiHint: "document paper invoice",
    }));
  } catch (error) {
    console.error("Prisma error in getQuotes:", error);
    throw new Error("Could not fetch quotes. Database operation failed.");
  }
}

export async function createQuote(data: QuoteFormValues): Promise<QuoteFE> {
  const tenantId = tenantIdPlaceholder;
  const validation = QuoteFormSchema.safeParse(data);
  if (!validation.success) {
    console.error("CreateQuote Validation Error:", validation.error.flatten().fieldErrors);
    throw new Error(`Invalid quote data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }

  const { lineItems, expiryDate, ...quoteData } = validation.data;

  try {
    const newQuote = await prisma.quote.create({
      data: {
        ...quoteData,
        tenantId,
        quoteNumber: `QT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`, // Simple quote number
        dateCreated: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        lineItems: {
          create: lineItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tenantId,
          })),
        },
      },
      include: { // Re-fetch to match QuoteFE structure
        opportunity: { select: { name: true } },
        lineItems: { include: { product: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
      }
    });
    revalidatePath('/crm/quotes');
    return {
        ...newQuote,
        dateCreated: newQuote.dateCreated,
        opportunityName: newQuote.opportunity?.name,
        lineItems: newQuote.lineItems.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toNumber(),
            total: (item.quantity * item.unitPrice.toNumber()),
        })),
        totalAmount: newQuote.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice.toNumber()), 0),
        dataAiHint: "document paper invoice",
    };
  } catch (error) {
    console.error("Prisma error in createQuote:", error);
    throw new Error("Could not create quote. Database operation failed.");
  }
}

export async function updateQuote(id: string, data: QuoteFormValues): Promise<QuoteFE> {
  const tenantId = tenantIdPlaceholder;
  const validation = QuoteFormSchema.safeParse(data);
  if (!validation.success) {
     console.error("UpdateQuote Validation Error:", validation.error.flatten().fieldErrors);
    throw new Error(`Invalid quote data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }
  const { lineItems, expiryDate, ...quoteData } = validation.data;

  try {
    const updatedQuote = await prisma.$transaction(async (prismaTx) => {
      const q = await prismaTx.quote.update({
        where: { id, tenantId, deletedAt: null },
        data: {
          ...quoteData,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          updatedAt: new Date(),
        },
      });

      await prismaTx.quoteLineItem.deleteMany({
        where: { quoteId: id, tenantId },
      });

      await prismaTx.quoteLineItem.createMany({
        data: lineItems.map(item => ({
          quoteId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tenantId,
        })),
      });
      
      return q;
    });


    revalidatePath('/crm/quotes');
    const result = await prisma.quote.findUniqueOrThrow({
        where: { id },
        include: {
            opportunity: { select: { name: true } },
            lineItems: { include: { product: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
        }
    });
     return {
        ...result,
        dateCreated: result.dateCreated,
        opportunityName: result.opportunity?.name,
        lineItems: result.lineItems.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toNumber(),
            total: (item.quantity * item.unitPrice.toNumber()),
        })),
        totalAmount: result.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice.toNumber()), 0),
        dataAiHint: "document paper invoice",
    };

  } catch (error) {
    console.error(`Prisma error in updateQuote ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new Error(`Quote with ID ${id} not found or has been deleted.`);
    }
    throw new Error("Could not update quote. Database operation failed.");
  }
}

export async function deleteQuote(id: string): Promise<{ success: boolean; message?: string }> {
  const tenantId = tenantIdPlaceholder;
  try {
    await prisma.quoteLineItem.updateMany({
      where: { quoteId: id, tenantId: tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    await prisma.quote.update({
      where: { id, tenantId: tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    revalidatePath('/crm/quotes');
    return { success: true };
  } catch (error) {
    console.error(`Prisma error in deleteQuote ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, message: `Quote with ID ${id} not found or already deleted.` };
    }
    return { success: false, message: "Could not delete quote. Database operation failed." };
  }
}


// Functions to get data for Select components
export async function getLeadsForSelect(): Promise<{ id: string; name: string }[]> {
  return getLeadsForSelectFromLeadsModule();
}

export async function getProductsForSelect(): Promise<{ id: string; name: string; type: PrismaProductType; price: number }[]> {
  return getProductsForSelectFromProductsModule();
}
