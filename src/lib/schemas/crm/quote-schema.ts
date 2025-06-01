
import { z } from 'zod';
import type { QuoteStatus as PrismaQuoteStatus } from '@prisma/client';

// Define QuoteStatus enum matching Prisma for validation if client-side differs
// Or use Prisma's enum directly if they are identical and Prisma types are available client-side
export const QuoteStatusEnum = z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELED"]);

export const QuoteLineItemSchema = z.object({
  id: z.string().optional(), // Optional for new items being added client-side before save
  productId: z.string().min(1, "Product is required"),
  productName: z.string(), // For display/convenience, derived from productId on server
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  // total is calculated: quantity * unitPrice, not part of the form schema for direct input
});

export const QuoteFormSchema = z.object({
  opportunityId: z.string().min(1, "Opportunity (Lead) is required"),
  expiryDate: z.string().optional().nullable(), // Date as string, convert in action
  status: QuoteStatusEnum,
  lineItems: z.array(QuoteLineItemSchema).min(1, "At least one line item is required"),
  notes: z.string().optional().nullable(),
});

export type QuoteFormValues = z.infer<typeof QuoteFormSchema>;
