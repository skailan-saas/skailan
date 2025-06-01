
'use server';

import { PrismaClient, type Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Lead as PrismaLead, LeadStatus, LeadSource, Tag as PrismaTag } from '@prisma/client';

const prisma = new PrismaClient();

// IMPORTANT: Replace with actual tenantId from user session or context
const tenantIdPlaceholder = "your-tenant-id"; 

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
  assignedToUserId: z.string().optional().nullable(), 
});

export type LeadFormValues = z.infer<typeof LeadFormSchema>;

// Frontend Lead type, might differ slightly from PrismaLead for UI needs
export interface LeadFE extends Omit<PrismaLead, 'companyId' | 'assignedToUserId' | 'chatbotFlowState' | 'tenantId'> {
  companyName?: string; // For display
  assignedTo?: { id: string; name: string | null; avatarUrl?: string | null; } | null; // For display
  tags: string[]; // Array of tag names
  dataAiHint?: string; // For UI only
  // Explicitly include fields that might be null in Prisma but handled as undefined or string in FE
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  expectedCloseDate?: Date | null;
  opportunityValue?: number | null;
}


async function findOrCreateCompany(prismaTx: Prisma.TransactionClient, name: string, tenantId: string): Promise<string | undefined> {
  if (!name.trim()) return undefined;
  try {
    let company = await prismaTx.company.findFirst({
      where: { name, tenantId, deletedAt: null },
    });
    if (!company) {
      company = await prismaTx.company.create({
        data: {
          name,
          tenantId,
        },
      });
    }
    return company.id;
  } catch (error) {
    console.error("Prisma error in findOrCreateCompany (within leads/actions.ts):", error);
    return undefined; 
  }
}

async function manageLeadTags(prismaTx: Prisma.TransactionClient, leadId: string, tagNamesString: string | undefined, tenantId: string) {
  // Delete existing tags for this lead
  await prismaTx.leadTag.deleteMany({
    where: { leadId, tenantId },
  });

  if (tagNamesString && tagNamesString.trim() !== "") {
    const tagNamesArray = tagNamesString.split(',').map(t => t.trim()).filter(t => t);
    if (tagNamesArray.length > 0) {
      const tagOperations = tagNamesArray.map(name =>
        prismaTx.tag.upsert({
          where: { tenantId_name: { tenantId, name } },
          update: {},
          create: { name, tenantId },
        })
      );
      const createdOrFoundTags = await Promise.all(tagOperations);

      await prismaTx.leadTag.createMany({
        data: createdOrFoundTags.map(tag => ({
          leadId,
          tagId: tag.id,
          tenantId,
        })),
        skipDuplicates: true,
      });
    }
  }
}


export async function getLeads(): Promise<LeadFE[]> {
  try {
    const leadsFromDb = await prisma.lead.findMany({
      where: { tenantId: tenantIdPlaceholder, deletedAt: null },
      include: {
        company: { select: { name: true } },
        assignedTo: { select: { userId: true, user: { select: { fullName: true, email: true, avatarUrl: true } } } },
        tags: { include: { tag: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return leadsFromDb.map(lead => ({
      ...lead, // Spread Prisma lead
      id: lead.id,
      name: lead.name,
      email: lead.email ?? undefined,
      phone: lead.phone ?? undefined,
      source: lead.source as LeadSource, 
      status: lead.status as LeadStatus,
      notes: lead.notes ?? undefined,
      lastContacted: lead.lastContacted,
      opportunityValue: lead.opportunityValue,
      expectedCloseDate: lead.expectedCloseDate,
      companyName: lead.company?.name ?? undefined,
      assignedTo: lead.assignedTo ? { 
        id: lead.assignedTo.userId, 
        name: lead.assignedTo.user.fullName || lead.assignedTo.user.email,
        avatarUrl: lead.assignedTo.user.avatarUrl 
      } : null,
      tags: lead.tags.map(leadTag => leadTag.tag.name),
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      deletedAt: lead.deletedAt ?? undefined,
    }));
  } catch (error) {
    console.error("Prisma error in getLeads:", error);
    throw new Error("Could not fetch leads. Database operation failed.");
  }
}

export async function createLead(data: LeadFormValues): Promise<LeadFE> {
  const validation = LeadFormSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid lead data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }
  const { companyName, tags: tagsString, ...leadData } = validation.data;
  
  try {
    const newLead = await prisma.$transaction(async (prismaTx) => {
      const companyId = companyName ? await findOrCreateCompany(prismaTx, companyName, tenantIdPlaceholder) : undefined;
      
      const createdLead = await prismaTx.lead.create({
        data: {
          ...leadData,
          tenantId: tenantIdPlaceholder,
          companyId: companyId,
          email: leadData.email || null,
          phone: leadData.phone || null,
          notes: leadData.notes || null,
          assignedToUserId: leadData.assignedToUserId || null,
        },
      });

      await manageLeadTags(prismaTx, createdLead.id, tagsString, tenantIdPlaceholder);
      return createdLead;
    });
    
    revalidatePath('/crm/leads');
    // Fetch the newly created lead with all relations to match LeadFE
    const result = await prisma.lead.findUniqueOrThrow({
        where: { id: newLead.id },
        include: {
            company: { select: { name: true } },
            assignedTo: { select: { userId: true, user: { select: { fullName: true, email: true, avatarUrl: true } } } },
            tags: { include: { tag: { select: { name: true } } } },
        }
    });
     return {
        ...result,
        email: result.email ?? undefined,
        phone: result.phone ?? undefined,
        notes: result.notes ?? undefined,
        companyName: result.company?.name ?? undefined,
        assignedTo: result.assignedTo ? { 
          id: result.assignedTo.userId, 
          name: result.assignedTo.user.fullName || result.assignedTo.user.email,
          avatarUrl: result.assignedTo.user.avatarUrl
        } : null,
        tags: result.tags.map(leadTag => leadTag.tag.name),
        source: result.source as LeadSource,
        status: result.status as LeadStatus,
    };
  } catch (error) {
    console.error("Prisma error in createLead:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      if ((error.meta?.target as string[])?.includes('email') && (error.meta?.target as string[])?.includes('tenantId')) {
        throw new Error("A lead with this email already exists in this tenant.");
      }
    }
    throw new Error("Could not create lead. Database operation failed.");
  }
}

export async function updateLead(id: string, data: LeadFormValues): Promise<LeadFE> {
  const validation = LeadFormSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid lead data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }
  const { companyName, tags: tagsString, ...leadData } = validation.data;

  try {
    const updatedLead = await prisma.$transaction(async (prismaTx) => {
        const companyId = companyName ? await findOrCreateCompany(prismaTx, companyName, tenantIdPlaceholder) : undefined;

        const currentLead = await prismaTx.lead.update({
            where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
            data: {
            ...leadData,
            companyId: companyId,
            email: leadData.email || null,
            phone: leadData.phone || null,
            notes: leadData.notes || null,
            assignedToUserId: leadData.assignedToUserId || null,
            updatedAt: new Date(),
            },
        });

        await manageLeadTags(prismaTx, currentLead.id, tagsString, tenantIdPlaceholder);
        return currentLead;
    });

    revalidatePath('/crm/leads');
    const result = await prisma.lead.findUniqueOrThrow({
        where: { id: updatedLead.id },
        include: {
            company: { select: { name: true } },
            assignedTo: { select: { userId: true, user: { select: { fullName: true, email: true, avatarUrl: true } } } },
            tags: { include: { tag: { select: { name: true } } } },
        }
    });
     return {
        ...result,
        email: result.email ?? undefined,
        phone: result.phone ?? undefined,
        notes: result.notes ?? undefined,
        companyName: result.company?.name ?? undefined,
        assignedTo: result.assignedTo ? { 
          id: result.assignedTo.userId, 
          name: result.assignedTo.user.fullName || result.assignedTo.user.email,
          avatarUrl: result.assignedTo.user.avatarUrl
        } : null,
        tags: result.tags.map(leadTag => leadTag.tag.name),
        source: result.source as LeadSource,
        status: result.status as LeadStatus,
    };
  } catch (error) {
    console.error(`Prisma error in updateLead for ID ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            throw new Error(`Lead with ID ${id} not found or has been deleted.`);
        }
        if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('email') && (error.meta?.target as string[])?.includes('tenantId')) {
           throw new Error("A lead with this email already exists in this tenant.");
        }
    }
    throw new Error("Could not update lead. Database operation failed.");
  }
}

export async function deleteLead(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.lead.update({
      where: { id, tenantId: tenantIdPlaceholder, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    revalidatePath('/crm/leads');
    return { success: true };
  } catch (error) {
    console.error(`Prisma error in deleteLead for ID ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return { success: false, message: `Lead with ID ${id} not found or already deleted.` };
    }
    return { success: false, message: "Could not delete lead. Database operation failed." };
  }
}

// Function to get leads for select components (used by Quotes, Tasks, Projects if Lead acts as Opportunity)
export async function getLeadsForSelect(): Promise<{ id: string; name: string }[]> {
    try {
      const leads = await prisma.lead.findMany({
        where: {
          tenantId: tenantIdPlaceholder,
          deletedAt: null,
          // Optionally filter by statuses that represent opportunities, e.g., not 'CLOSED_LOST', 'UNQUALIFIED'
          // status: { notIn: ['CLOSED_LOST', 'UNQUALIFIED', 'ARCHIVED'] } 
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      return leads;
    } catch (error) {
      console.error("Prisma error in getLeadsForSelect (within leads/actions.ts):", error);
      throw new Error("Could not fetch leads for selection. Database operation failed.");
    }
}

