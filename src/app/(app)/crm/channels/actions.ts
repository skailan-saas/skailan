import { getCurrentUserWithTenant } from "@/lib/session";

export async function getChannels(): Promise<ChannelFE[]> {
  try {
    const user = await getCurrentUserWithTenant();
    if (!user || !user.tenantId) {
      throw new Error("No tenant found - please check your domain configuration");
    }
    const channelsFromDb = await prisma.channel.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      // ...otros includes y selects necesarios
    });
    // ...map y lógica de transformación
    return channelsFromDb.map((channel) => ({
      // ...transformación de channel
      ...channel
    }));
  } catch (error) {
    console.error("Prisma error in getChannels:", error);
    throw new Error("Could not fetch channels. Database operation failed.");
  }
} 