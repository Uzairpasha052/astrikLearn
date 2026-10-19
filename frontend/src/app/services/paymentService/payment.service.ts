import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import {
  PaymentDisplayDto,
  CreatePaymentDto,
  AllocatePaymentDto,
  PaymentAllocationDisplayDto
} from '../../model/Payment.model';
import { PagedResult } from '../../model/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private url = `${environment.apiUrl}/api/payment`;

  constructor(private http: HttpClient) {}

  getPayments(
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<PagedResult<PaymentDisplayDto>> {
    return this.http.get<PagedResult<PaymentDisplayDto>>(this.url, {
      params: { pageNumber, pageSize }
    });
  }

  getPaymentById(id: number): Observable<PaymentDisplayDto> {
    return this.http.get<PaymentDisplayDto>(`${this.url}/${id}`);
  }

  createPayment(dto: CreatePaymentDto): Observable<PaymentDisplayDto> {
    return this.http.post<PaymentDisplayDto>(this.url, dto);
  }

  allocatePayment(
    paymentId: number,
    dto: AllocatePaymentDto
  ): Observable<PaymentAllocationDisplayDto[]> {
    return this.http.post<PaymentAllocationDisplayDto[]>(
      `${this.url}/${paymentId}/allocations`,
      dto
    );
  }
}
