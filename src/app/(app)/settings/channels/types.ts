import { ConversationChannel } from "@prisma/client";

// Define ChannelStatus enum manually until Prisma client is regenerated
export enum ChannelStatus {
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
  PENDING_WEBHOOK = "PENDING_WEBHOOK",
  NEEDS_ATTENTION = "NEEDS_ATTENTION",
  ERROR = "ERROR",
}

export interface ChannelData {
  id?: string;
  instanceName: string;
  channelType: ConversationChannel;
  status?: ChannelStatus;
  webhookUrl?: string;
  verifyToken?: string;
  details?: string;
  phoneNumberId?: string;
  phoneNumber?: string;
  wabaId?: string;
  accessToken?: string;
  pageId?: string;
  appSecret?: string;
  botToken?: string;
  apiEndpoint?: string;
}
