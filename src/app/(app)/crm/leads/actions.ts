
'use server';

import { PrismaClient, type Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Lead as PrismaLead, LeadStatus, LeadSource, Tag as PrismaTag } from '@prisma/client';

const prisma = new PrismaClient();

// Zod Enums from Prisma Enums
const LeadStatusEnum = z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "CONVERTED", "CLOSED_WON", "CLOSED_LOST", "UNQUALIFIED", "ARCHIVED"]);
const LeadSourceEnum = z.enum(["WhatsApp", "WebChat", "Messenger", "Instagram", "Manual", "Referral", "API", "Other"]);


const LeadFormSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  companyName: z.string().optional(), // This will be used to find/create Company and link companyId
  source: LeadSourceEnum,
  status: LeadStatusEnum,
  tags: z.string().optional(), // Comma-separated string of tag names
  notes: z.string().optional(),
  assignedToUserId: z.string().optional(), // Assuming you might add a selector for this
});

export type LeadFormValues = z.infer<typeof LeadFormSchema>;

// Frontend Lead type, might differ slightly from PrismaLead for UI needs
export interface LeadFE extends Omit<PrismaLead, 'companyId' | 'assignedToUserId' | 'opportunityId' | 'chatbotFlowState' | 'tenantId'> {
  companyName?: string; // For display
  assignedTo?: { id: string; name: string | null; } | null; // For display
  tags: string[]; // Array of tag names
  dataAiHint?: string; // For UI only
}


async function findOrCreateCompany(name: string, tenantId: string): Promise<string | undefined> {
  if (!name.trim()) return undefined;
  try {
    let company = await prisma.company.findFirst({
      where: { name, tenantId, deletedAt: null },
    });
    if (!company) {
      company = await prisma.company.create({
        data: {
          name,
          tenantId,
        },
      });
    }
    return company.id;
  } catch (error) {
    console.error("Error finding or creating company:", error);
    return undefined; // Or throw error
  }
}

async function manageTags(tagNames: string[], tenantId: string): Promise<Array<{ tagId: string }>> {
  if (!tagNames || tagNames.length === 0) return [];
  const tagOperations = tagNames.map(async (name) => {
    let tag = await prisma.tag.findUnique({
      where: { tenantId_name: { tenantId, name }, deletedAt: null },
    });
    if (!tag) {
      tag = await prisma.tag.create({
        data: { name, tenantId },
      });
    }
    return { tagId: tag.id };
  });
  return Promise.all(tagOperations);
}


export async function getLeads(): Promise<LeadFE[]> {
  const tenantIdPlaceholder = "your-tenant-id"; // Replace with actual tenantId logic
  try {
    const leadsFromDb = await prisma.lead.findMany({
      where: { tenantId: tenantIdPlaceholder, deletedAt: null },
      include: {
        company: { select: { name: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } }, // Fetching more from TenantUser
        tags: { include: { tag: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return leadsFromDb.map(lead => ({
      ...lead,
      email: lead.email ?? undefined,
      phone: lead.phone ?? undefined,
      notes: lead.notes ?? undefined,
      companyName: lead.company?.name ?? undefined,
      assignedTo: lead.assignedTo ? { id: lead.assignedTo.id, name: lead.assignedTo.fullName || lead.assignedTo.email } : null,
      tags: lead.tags.map(leadTag => leadTag.tag.name),
      source: lead.source as LeadSource, // Prisma enum to page enum (assuming they match)
      status: lead.status as LeadStatus, // Prisma enum to page enum
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    }));
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    throw new Error("Could not fetch leads.");
  }
}

export async function createLead(data: LeadFormValues): Promise<LeadFE> {
  const tenantIdPlaceholder = "your-tenant-id"; // Replace with actual tenantId logic
  const validation = LeadFormSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid lead data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }
  const { companyName, tags: tagsString, ...leadData } = validation.data;

  const companyId = companyName ? await findOrCreateCompany(companyName, tenantIdPlaceholder) : undefined;
  const tagNamesArray = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t) : [];
  
  try {
    const newLead = await prisma.lead.create({
      data: {
        ...leadData,
        tenantId: tenantIdPlaceholder,
        companyId: companyId,
        email: leadData.email || null,
        phone: leadData.phone || null,
        notes: leadData.notes || null,
        assignedToUserId: leadData.assignedToUserId || null,
        tags: tagNamesArray.length > 0 ? {
          create: tagNamesArray.map(name => ({
            tenantId: tenantIdPlaceholder,
            tag: {
              connectOrCreate: {
                where: { tenantId_name: { tenantId: tenantIdPlaceholder, name } },
                create: { name, tenantId: tenantIdPlaceholder },
              },
            },
          })),
        } : undefined,
      },
      include: {
        company: { select: { name: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    });
    revalidatePath('/crm/leads');
    return {
        ...newLead,
        email: newLead.email ?? undefined,
        phone: newLead.phone ?? undefined,
        notes: newLead.notes ?? undefined,
        companyName: newLead.company?.name ?? undefined,
        assignedTo: newLead.assignedTo ? { id: newLead.assignedTo.id, name: newLead.assignedTo.fullName || newLead.assignedTo.email } : null,
        tags: newLead.tags.map(leadTag => leadTag.tag.name),
        source: newLead.source as LeadSource,
        status: newLead.status as LeadStatus,
        createdAt: newLead.createdAt,
        updatedAt: newLead.updatedAt,
    };
  } catch (error) {
    console.error("Failed to create lead:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Assuming the target is the email unique constraint
      if ((error.meta?.target as string[])?.includes('email') && (error.meta?.target as string[])?.includes('tenantId')) {
        throw new Error("A lead with this email already exists in this tenant.");
      }
    }
    throw new Error("Could not create lead.");
  }
}

export async function updateLead(id: string, data: LeadFormValues): Promise<LeadFE> {
  const tenantIdPlaceholder = "your-tenant-id"; // Replace with actual tenantId logic
  const validation = LeadFormSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid lead data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }
  const { companyName, tags: tagsString, ...leadData } = validation.data;

  const companyId = companyName ? await findOrCreateCompany(companyName, tenantIdPlaceholder) : undefined;
  const tagNamesArray = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t) : [];

  try {
    // For tags, a common strategy is to disconnect all existing tags and then connect/create the new ones.
    // More complex logic would involve diffing, but this is simpler for now.
    await prisma.leadTag.deleteMany({
        where: { leadId: id, tenantId: tenantIdPlaceholder },
    });

    const updatedLead = await prisma.lead.update({
      where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
      data: {
        ...leadData,
        companyId: companyId,
        email: leadData.email || null,
        phone: leadData.phone || null,
        notes: leadData.notes || null,
        assignedToUserId: leadData.assignedToUserId || null,
        tags: tagNamesArray.length > 0 ? {
          create: tagNamesArray.map(name => ({
            tenantId: tenantIdPlaceholder,
            tag: {
              connectOrCreate: {
                where: { tenantId_name: { tenantId: tenantIdPlaceholder, name } },
                create: { name, tenantId: tenantIdPlaceholder },
              },
            },
          })),
        } : undefined,
      },
      include: {
        company: { select: { name: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    });
    revalidatePath('/crm/leads');
     return {
        ...updatedLead,
        email: updatedLead.email ?? undefined,
        phone: updatedLead.phone ?? undefined,
        notes: updatedLead.notes ?? undefined,
        companyName: updatedLead.company?.name ?? undefined,
        assignedTo: updatedLead.assignedTo ? { id: updatedLead.assignedTo.id, name: updatedLead.assignedTo.fullName || updatedLead.assignedTo.email } : null,
        tags: updatedLead.tags.map(leadTag => leadTag.tag.name),
        source: updatedLead.source as LeadSource,
        status: updatedLead.status as LeadStatus,
        createdAt: updatedLead.createdAt,
        updatedAt: updatedLead.updatedAt,
    };
  } catch (error) {
    console.error(`Failed to update lead ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            throw new Error(`Lead with ID ${id} not found or has been deleted.`);
        }
        if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('email') && (error.meta?.target as string[])?.includes('tenantId')) {
           throw new Error("A lead with this email already exists in this tenant.");
        }
    }
    throw new Error("Could not update lead.");
  }
}

export async function deleteLead(id: string): Promise<{ success: boolean; message?: string }> {
  const tenantIdPlaceholder = "your-tenant-id"; // Replace with actual tenantId logic
  try {
    await prisma.lead.update({
      where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    revalidatePath('/crm/leads');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete lead ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return { success: false, message: `Lead with ID ${id} not found or already deleted.` };
    }
    return { success: false, message: "Could not delete lead." };
  }
}
