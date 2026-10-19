export interface InvoiceItemDisplayDto {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
}

export interface InvoiceDisplayDto {
  id: number;
  customerId: number;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  outstandingAmount: number;
  items: InvoiceItemDisplayDto[];
}

export interface CreateInvoiceItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceDto {
  customerId: number;
  invoiceDate: string;
  dueDate: string;
  items: CreateInvoiceItemDto[];
}

export interface UpdateInvoiceDto {
  customerId: number;
  invoiceDate: string;
  dueDate: string;
  items: CreateInvoiceItemDto[];
}
