
'use server';

import { PrismaClient, type Prisma } from '@prisma/client';
import type { Company } from './page'; 
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const prisma = new PrismaClient();

const CompanyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL format (e.g., https://example.com)").optional().or(z.literal('')),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressPostalCode: z.string().optional(),
  addressCountry: z.string().optional(),
  description: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof CompanyFormSchema>;


export async function getCompanies(): Promise<Company[]> {
  try {
    const companiesFromDb = await prisma.company.findMany({
      where: {
        deletedAt: null, // Only fetch non-deleted companies
      },
      orderBy: {
        createdAt: 'desc', 
      },
    });
    // Ensure all optional fields are handled correctly for the frontend interface
    return companiesFromDb.map(company => ({
        ...company,
        id: company.id,
        email: company.email ?? undefined,
        phone: company.phone ?? undefined,
        website: company.website ?? undefined,
        addressStreet: company.addressStreet ?? undefined,
        addressCity: company.addressCity ?? undefined,
        addressState: company.addressState ?? undefined,
        addressPostalCode: company.addressPostalCode ?? undefined,
        addressCountry: company.addressCountry ?? undefined,
        description: company.description ?? undefined,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        deletedAt: company.deletedAt ?? undefined, // Include deletedAt if needed by UI, otherwise can omit
    }));
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    throw new Error("Could not fetch companies.");
  }
}

export async function createCompany(data: CompanyFormValues): Promise<Company> {
  const validation = CompanyFormSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid company data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }

  const { name, email, phone, website, addressStreet, addressCity, addressState, addressPostalCode, addressCountry, description } = validation.data;

  // Assuming tenantId is handled by Prisma middleware or passed differently
  // For now, this example doesn't explicitly set tenantId, relying on context or future setup
  const tenantIdPlaceholder = "your-tenant-id"; // Replace with actual tenantId logic

  try {
    const newCompany = await prisma.company.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        website: website || null,
        addressStreet: addressStreet || null,
        addressCity: addressCity || null,
        addressState: addressState || null,
        addressPostalCode: addressPostalCode || null,
        addressCountry: addressCountry || null,
        description: description || null,
        tenantId: tenantIdPlaceholder, // Placeholder: This needs to come from user session or context
      },
    });
    revalidatePath('/crm/companies');
    return {
        ...newCompany,
        id: newCompany.id,
        email: newCompany.email ?? undefined,
        phone: newCompany.phone ?? undefined,
        website: newCompany.website ?? undefined,
        addressStreet: newCompany.addressStreet ?? undefined,
        addressCity: newCompany.addressCity ?? undefined,
        addressState: newCompany.addressState ?? undefined,
        addressPostalCode: newCompany.addressPostalCode ?? undefined,
        addressCountry: newCompany.addressCountry ?? undefined,
        description: newCompany.description ?? undefined,
        createdAt: newCompany.createdAt,
        updatedAt: newCompany.updatedAt,
        deletedAt: newCompany.deletedAt ?? undefined,
    };
  } catch (error) {
    console.error("Failed to create company:", error);
    // Handle specific Prisma errors, e.g., unique constraint violation P2002
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && error.meta?.target === 'Company_email_key') {
             throw new Error("A company with this email already exists.");
        }
    }
    throw new Error("Could not create company.");
  }
}

export async function updateCompany(id: string, data: CompanyFormValues): Promise<Company> {
  const validation = CompanyFormSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid company data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }

  const { name, email, phone, website, addressStreet, addressCity, addressState, addressPostalCode, addressCountry, description } = validation.data;

  try {
    const updatedCompany = await prisma.company.update({
      where: { id, deletedAt: null }, // Ensure we only update non-deleted companies
      data: {
        name,
        email: email || null,
        phone: phone || null,
        website: website || null,
        addressStreet: addressStreet || null,
        addressCity: addressCity || null,
        addressState: addressState || null,
        addressPostalCode: addressPostalCode || null,
        addressCountry: addressCountry || null,
        description: description || null,
        updatedAt: new Date(), // Explicitly set updatedAt
      },
    });
    revalidatePath('/crm/companies');
     return {
        ...updatedCompany,
        id: updatedCompany.id,
        email: updatedCompany.email ?? undefined,
        phone: updatedCompany.phone ?? undefined,
        website: updatedCompany.website ?? undefined,
        addressStreet: updatedCompany.addressStreet ?? undefined,
        addressCity: updatedCompany.addressCity ?? undefined,
        addressState: updatedCompany.addressState ?? undefined,
        addressPostalCode: updatedCompany.addressPostalCode ?? undefined,
        addressCountry: updatedCompany.addressCountry ?? undefined,
        description: updatedCompany.description ?? undefined,
        createdAt: updatedCompany.createdAt,
        updatedAt: updatedCompany.updatedAt,
        deletedAt: updatedCompany.deletedAt ?? undefined,
    };
  } catch (error) {
    console.error(`Failed to update company ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Record to update not found
            throw new Error(`Company with ID ${id} not found or has been deleted.`);
        }
         if (error.code === 'P2002' && error.meta?.target === 'Company_email_key') {
             throw new Error("A company with this email already exists.");
        }
    }
    throw new Error("Could not update company.");
  }
}


export async function deleteCompany(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.company.update({
      where: { id, deletedAt: null }, // Ensure we only soft-delete non-deleted companies
      data: {
        deletedAt: new Date(),
      },
    });
    revalidatePath('/crm/companies');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete company ${id}:`, error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Record to update not found (already deleted or never existed)
        return { success: false, message: `Company with ID ${id} not found or already deleted.` };
    }
    return { success: false, message: "Could not delete company." };
  }
}
