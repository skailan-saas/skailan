export interface WhatsappConfigFormData {
  id: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookVerifyToken: string;
  displayPhoneNumber: string;
  isActive: boolean;
  businessName: string;
  businessDescription: string;
  businessWebsite: string;
  businessEmail: string;
  businessAddress: string;
  businessVertical: string;
}

export interface WhatsappApiResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
  count?: number;
}
