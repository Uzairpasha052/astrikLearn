import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import {
  InvoiceDisplayDto,
  CreateInvoiceDto,
  UpdateInvoiceDto
} from '../../model/Invoice.model';
import { PagedResult } from '../../model/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private url = `${environment.apiUrl}/api/invoice`;

  constructor(private http: HttpClient) {}

  getInvoices(
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<PagedResult<InvoiceDisplayDto>> {
    return this.http.get<PagedResult<InvoiceDisplayDto>>(this.url, {
      params: { pageNumber, pageSize }
    });
  }

  getInvoiceById(id: number): Observable<InvoiceDisplayDto> {
    return this.http.get<InvoiceDisplayDto>(`${this.url}/${id}`);
  }

  createInvoice(dto: CreateInvoiceDto): Observable<InvoiceDisplayDto> {
    return this.http.post<InvoiceDisplayDto>(this.url, dto);
  }

  updateInvoice(id: number, dto: UpdateInvoiceDto): Observable<InvoiceDisplayDto> {
    return this.http.put<InvoiceDisplayDto>(`${this.url}/${id}`, dto);
  }

  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
