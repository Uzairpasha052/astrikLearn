export interface PaymentDisplayDto {
  id: number;
  customerId: number;
  customerName: string;
  paymentDate: string;
  amount: number;
  amountAllocated: number;
  unallocatedAmount: number;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface CreatePaymentDto {
  customerId: number;
  paymentDate: string;
  amount: number;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface PaymentAllocationItemDto {
  invoiceId: number;
  allocatedAmount: number;
}

export interface AllocatePaymentDto {
  allocations: PaymentAllocationItemDto[];
}

export interface PaymentAllocationDisplayDto {
  id: number;
  paymentId: number;
  invoiceId: number;
  invoiceNumber: string;
  allocatedAmount: number;
  createdAt: string;
}
