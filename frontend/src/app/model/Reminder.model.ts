export interface ReminderDisplayDto {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  customerName: string;
  reminderDate: string;
  reminderType: string;
  message?: string;
  status: string;
  createdAt: string;
  createdBy?: number;
  updatedAt?: string;
  updatedBy?: number;
}

export interface CreateReminderDto {
  invoiceId: number;
  reminderDate: string;
  reminderType: string;
  message?: string;
}

export interface UpdateReminderDto {
  reminderDate: string;
  reminderType: string;
  message?: string;
}
