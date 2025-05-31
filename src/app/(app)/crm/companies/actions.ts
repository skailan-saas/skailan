
'use server';

import { PrismaClient } from '@prisma/client';
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
      orderBy: {
        createdAt: 'desc', 
      },
    });
    return companiesFromDb.map(company => ({
        ...company,
        id: company.id, // Ensure ID is always present
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
    };
  } catch (error) {
    console.error("Failed to create company:", error);
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
      where: { id },
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
    };
  } catch (error) {
    console.error(`Failed to update company ${id}:`, error);
    // Consider Prisma error codes for more specific messages, e.g., P2025 for record not found
    if ((error as any).code === 'P2025') {
        throw new Error(`Company with ID ${id} not found.`);
    }
    throw new Error("Could not update company.");
  }
}
