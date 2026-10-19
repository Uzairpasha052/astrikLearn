export interface CustomerDto {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  created?: string;
  date?: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export type UpdateCustomerDto = CreateCustomerDto;

export interface CustomerResponse {
  message: string;
  customer: CustomerDto;
}
