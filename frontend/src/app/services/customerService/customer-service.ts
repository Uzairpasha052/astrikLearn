import { environment } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { CustomerDto, CreateCustomerDto, UpdateCustomerDto, CustomerResponse } from '../../model/Customer.model';
import { PagedResult } from '../../model/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private url = `${environment.apiUrl}/api/customer`;

  constructor(private http: HttpClient) {}

  getCustomers(
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<PagedResult<CustomerDto>> {
    return this.http.get<PagedResult<CustomerDto>>(this.url, {
      params: { pageNumber, pageSize }
    });
  }

  getCustomerById(id: number): Observable<CustomerDto> {
    return this.http.get<CustomerDto>(`${this.url}/${id}`);
  }

  createCustomer(dto: CreateCustomerDto): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(this.url, dto);
  }

  updateCustomer(id: number, dto: UpdateCustomerDto): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.url}/${id}`, dto);
  }

  deleteCustomer(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.url}/${id}`);
  }
}
