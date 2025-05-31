
'use server';

import { PrismaClient } from '@prisma/client';
import type { Company } from './page'; // Assuming Company type is exported from page.tsx or a shared types file
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for validating company creation data from the client
// This should match the CompanyFormSchema in page.tsx
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
        createdAt: 'desc', // Assuming createdAt field exists from Prisma's auto-timestamps
      },
    });
    // Map Prisma's Company to the frontend Company type
    // Note: Prisma might add id, createdAt, updatedAt automatically.
    // Ensure the frontend Company type is compatible.
    // For now, we'll cast, but a more robust mapping might be needed if types diverge.
    return companiesFromDb.map(company => ({
        ...company,
        email: company.email ?? undefined,
        phone: company.phone ?? undefined,
        website: company.website ?? undefined,
        addressStreet: company.addressStreet ?? undefined,
        addressCity: company.addressCity ?? undefined,
        addressState: company.addressState ?? undefined,
        addressPostalCode: company.addressPostalCode ?? undefined,
        addressCountry: company.addressCountry ?? undefined,
        description: company.description ?? undefined,
        // dataAiHint is a UI concern, not stored in DB per current schema
    })) as Company[];
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    throw new Error("Could not fetch companies.");
  }
}

export async function createCompany(data: CompanyFormValues): Promise<Company> {
  // Validate data against schema (optional here if client already does, but good for safety)
  const validation = CompanyFormSchema.safeParse(data);
  if (!validation.success) {
    // Simplified error handling for brevity
    throw new Error(`Invalid company data: ${validation.error.flatten().fieldErrors}`);
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
        email: newCompany.email ?? undefined,
        phone: newCompany.phone ?? undefined,
        website: newCompany.website ?? undefined,
        addressStreet: newCompany.addressStreet ?? undefined,
        addressCity: newCompany.addressCity ?? undefined,
        addressState: newCompany.addressState ?? undefined,
        addressPostalCode: newCompany.addressPostalCode ?? undefined,
        addressCountry: newCompany.addressCountry ?? undefined,
        description: newCompany.description ?? undefined,
    } as Company;
  } catch (error) {
    console.error("Failed to create company:", error);
    // Consider more specific error messages based on Prisma error codes
    throw new Error("Could not create company.");
  }
}
