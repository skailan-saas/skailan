"use server";

import {
  Prisma,
  type QuoteStatus as PrismaQuoteStatus,
  type ProductType as PrismaProductType,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  QuoteFormSchema,
  type QuoteFormValues,
} from "@/lib/schemas/crm/quote-schema";
import { getLeadsForSelect as getLeadsForSelectFromLeadsModule } from "@/app/(app)/crm/leads/actions";
import { getProductsForSelect as getProductsForSelectFromProductsModule } from "@/app/(app)/crm/products/actions";
import { getCurrentTenant } from "@/lib/tenant";

export interface QuoteLineItemFE
  extends Omit<
    Prisma.QuoteLineItemGetPayload<{ include: { product: true } }>,
    | "unitPrice"
    | "tenantId"
    | "quoteId"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
    | "product"
  > {
  productId: string; // Ensure productId is always string
  productName: string;
  unitPrice: number; // Ensure unitPrice is number
  total: number;
}

export interface OpportunityDetails {
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface QuoteFE {
  id: string;
  quoteNumber: string;
  opportunityId: string;
  opportunityName?: string; // Fetched from Lead
  opportunity?: OpportunityDetails; // Add opportunity details for preview
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
  try {
    console.log("getQuotes: Iniciando obtención de cotizaciones...");

    const tenant = await getCurrentTenant();
    if (!tenant) {
      console.error("getQuotes: No se pudo obtener el tenant actual");
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    console.log("getQuotes: Tenant obtenido:", {
      id: tenant.id,
      name: tenant.name,
    });

    const quotesFromDb = await prisma.quote.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      include: {
        opportunity: { select: { name: true, email: true, phone: true } },
        lineItems: {
          where: { deletedAt: null }, // Only include non-deleted line items
          include: {
            product: { select: { name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(
      `getQuotes: Se encontraron ${quotesFromDb.length} cotizaciones para el tenant ${tenant.id}`
    );

    return quotesFromDb.map((quote) => ({
      ...quote,
      dateCreated: quote.dateCreated,
      opportunityName: quote.opportunity?.name,
      opportunity: quote.opportunity
        ? {
            name: quote.opportunity.name,
            email: quote.opportunity.email,
            phone: quote.opportunity.phone,
          }
        : undefined,
      lineItems: quote.lineItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice), // Convert Decimal to number
        total: item.quantity * Number(item.unitPrice),
      })),
      totalAmount: quote.lineItems.reduce(
        (sum, item) => sum + item.quantity * Number(item.unitPrice),
        0
      ),
      dataAiHint: "document paper invoice",
    }));
  } catch (error) {
    console.error("Prisma error in getQuotes:", error);
    throw new Error("Could not fetch quotes. Database operation failed.");
  }
}

export async function createQuote(data: QuoteFormValues): Promise<QuoteFE> {
  console.log("createQuote: Iniciando creación de cotización con datos:", data);

  const validation = QuoteFormSchema.safeParse(data);
  if (!validation.success) {
    console.error(
      "createQuote: Validación fallida:",
      validation.error.flatten().fieldErrors
    );
    throw new Error(
      `Invalid quote data: ${JSON.stringify(
        validation.error.flatten().fieldErrors
      )}`
    );
  }

  const { lineItems, expiryDate, ...quoteData } = validation.data;

  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      console.error("createQuote: No se pudo obtener el tenant actual");
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    console.log("createQuote: Tenant obtenido:", {
      id: tenant.id,
      name: tenant.name,
    });
    console.log("createQuote: Datos de la cotización procesados:", {
      ...quoteData,
      lineItemsCount: lineItems.length,
    });

    const newQuote = await prisma.quote.create({
      data: {
        ...quoteData,
        tenantId: tenant.id,
        quoteNumber: `QT-${new Date().getFullYear()}-${String(
          Math.floor(Math.random() * 10000)
        ).padStart(4, "0")}`,
        dateCreated: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        lineItems: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tenantId: tenant.id,
          })),
        },
      },
      include: {
        opportunity: { select: { name: true, email: true, phone: true } },
        lineItems: {
          where: { deletedAt: null },
          include: { product: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    console.log("createQuote: Cotización creada exitosamente:", newQuote.id);

    revalidatePath("/crm/quotes");
    return {
      ...newQuote,
      dateCreated: newQuote.dateCreated,
      opportunityName: newQuote.opportunity?.name,
      opportunity: newQuote.opportunity
        ? {
            name: newQuote.opportunity.name,
            email: newQuote.opportunity.email,
            phone: newQuote.opportunity.phone,
          }
        : undefined,
      lineItems: newQuote.lineItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice), // Convert Decimal to number
        total: item.quantity * Number(item.unitPrice),
      })),
      totalAmount: newQuote.lineItems.reduce(
        (sum, item) => sum + item.quantity * Number(item.unitPrice),
        0
      ),
      dataAiHint: "document paper invoice",
    };
  } catch (error) {
    console.error("createQuote: Error completo:", error);
    throw new Error("Could not create quote. Database operation failed.");
  }
}

export async function updateQuote(
  id: string,
  data: QuoteFormValues
): Promise<QuoteFE> {
  console.log("updateQuote: Iniciando actualización de cotización:", {
    id,
    data,
  });

  const validation = QuoteFormSchema.safeParse(data);
  if (!validation.success) {
    console.error(
      "updateQuote: Validación fallida:",
      validation.error.flatten().fieldErrors
    );
    throw new Error(
      `Invalid quote data: ${JSON.stringify(
        validation.error.flatten().fieldErrors
      )}`
    );
  }
  const { lineItems, expiryDate, ...quoteData } = validation.data;

  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      console.error("updateQuote: No se pudo obtener el tenant actual");
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    console.log("updateQuote: Tenant obtenido:", {
      id: tenant.id,
      name: tenant.name,
    });

    const updatedQuote = await prisma.$transaction(async (prismaTx) => {
      // Fetch existing line items to compare
      const existingLineItems = await prismaTx.quoteLineItem.findMany({
        where: { quoteId: id, tenantId: tenant.id, deletedAt: null },
      });

      const q = await prismaTx.quote.update({
        where: { id, tenantId: tenant.id, deletedAt: null },
        data: {
          ...quoteData,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          updatedAt: new Date(),
        },
      });

      // Determine items to delete, update, or create
      const newLineItemProductIds = lineItems.map((li) => li.productId);

      // Delete items not in the new list
      const itemsToDelete = existingLineItems.filter(
        (eli) => !lineItems.find((nli) => nli.id === eli.id) // if new item has id, it's an update
      );
      for (const item of itemsToDelete) {
        await prismaTx.quoteLineItem.update({
          where: { id: item.id, tenantId: tenant.id },
          data: { deletedAt: new Date() },
        });
      }

      // Create or Update items
      for (const item of lineItems) {
        const existingItem = existingLineItems.find(
          (eli) => eli.id === item.id
        );
        if (existingItem) {
          // Update existing item
          await prismaTx.quoteLineItem.update({
            where: { id: item.id, tenantId: tenant.id },
            data: {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            },
          });
        } else {
          // Create new item
          await prismaTx.quoteLineItem.create({
            data: {
              quoteId: id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              tenantId: tenant.id,
            },
          });
        }
      }
      return q;
    });

    console.log(
      "updateQuote: Cotización actualizada exitosamente:",
      updatedQuote.id
    );

    revalidatePath("/crm/quotes");
    const result = await prisma.quote.findUniqueOrThrow({
      where: { id },
      include: {
        opportunity: { select: { name: true, email: true, phone: true } },
        lineItems: {
          where: { deletedAt: null },
          include: { product: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return {
      ...result,
      dateCreated: result.dateCreated,
      opportunityName: result.opportunity?.name,
      opportunity: result.opportunity
        ? {
            name: result.opportunity.name,
            email: result.opportunity.email,
            phone: result.opportunity.phone,
          }
        : undefined,
      lineItems: result.lineItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice), // Convert Decimal to number
        total: item.quantity * Number(item.unitPrice),
      })),
      totalAmount: result.lineItems.reduce(
        (sum: number, item: any) =>
          sum + item.quantity * Number(item.unitPrice),
        0
      ),
      dataAiHint: "document paper invoice",
    };
  } catch (error) {
    console.error(`updateQuote: Error para ID ${id}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(`Quote with ID ${id} not found or has been deleted.`);
    }
    throw new Error("Could not update quote. Database operation failed.");
  }
}

export async function deleteQuote(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("deleteQuote: Iniciando eliminación de cotización:", id);

    const tenant = await getCurrentTenant();
    if (!tenant) {
      console.error("deleteQuote: No se pudo obtener el tenant actual");
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    // Soft delete line items first
    await prisma.quoteLineItem.updateMany({
      where: { quoteId: id, tenantId: tenant.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    // Then soft delete the quote
    await prisma.quote.update({
      where: { id, tenantId: tenant.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    console.log("deleteQuote: Cotización eliminada exitosamente:", id);

    revalidatePath("/crm/quotes");
    return { success: true };
  } catch (error) {
    console.error(`deleteQuote: Error para ID ${id}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        message: `Quote with ID ${id} not found or already deleted.`,
      };
    }
    return {
      success: false,
      message: "Could not delete quote. Database operation failed.",
    };
  }
}

// Function to get a single quote for preview/PDF generation
export async function getQuoteById(id: string): Promise<QuoteFE | null> {
  try {
    console.log("getQuoteById: Obteniendo cotización:", id);

    const tenant = await getCurrentTenant();
    if (!tenant) {
      console.error("getQuoteById: No se pudo obtener el tenant actual");
      throw new Error(
        "No tenant found - please check your domain configuration"
      );
    }

    const quote = await prisma.quote.findFirst({
      where: { id, tenantId: tenant.id, deletedAt: null },
      include: {
        opportunity: {
          select: { name: true, email: true, phone: true },
        },
        lineItems: {
          where: { deletedAt: null },
          include: {
            product: { select: { name: true, description: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!quote) {
      return null;
    }

    return {
      ...quote,
      dateCreated: quote.dateCreated,
      opportunityName: quote.opportunity?.name,
      opportunity: quote.opportunity
        ? {
            name: quote.opportunity.name,
            email: quote.opportunity.email,
            phone: quote.opportunity.phone,
          }
        : undefined,
      lineItems: quote.lineItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: item.quantity * Number(item.unitPrice),
      })),
      totalAmount: quote.lineItems.reduce(
        (sum: number, item: any) =>
          sum + item.quantity * Number(item.unitPrice),
        0
      ),
      dataAiHint: "document paper invoice",
    };
  } catch (error) {
    console.error("getQuoteById: Error:", error);
    throw new Error("Could not fetch quote. Database operation failed.");
  }
}

// Function to generate PDF data for a quote
export async function generateQuotePDFData(id: string): Promise<{
  quote: QuoteFE;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}> {
  try {
    const quote = await getQuoteById(id);
    if (!quote) {
      throw new Error("Quote not found");
    }

    // Company information - this could be fetched from tenant settings
    const companyInfo = {
      name: "IA Punto Soluciones Tecnológicas",
      address: "123 Main Street, Anytown, USA 12345",
      phone: "(555) 123-4567",
      email: "sales@iapunto.com",
    };

    return {
      quote,
      companyInfo,
    };
  } catch (error) {
    console.error("generateQuotePDFData: Error:", error);
    throw new Error("Could not generate PDF data for quote.");
  }
}

// Functions to get data for Select components
export async function getLeadsForSelect(): Promise<
  { id: string; name: string }[]
> {
  return getLeadsForSelectFromLeadsModule();
}

export async function getProductsForSelect(): Promise<
  { id: string; name: string; type: PrismaProductType; price: number }[]
> {
  return getProductsForSelectFromProductsModule();
}
