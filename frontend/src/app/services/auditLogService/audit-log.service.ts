import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environment/environment';
import { AuditLogDto } from '../../model/AuditLog.model';
import { PagedResult } from '../../model/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private http = inject(HttpClient);

  // Backend AuditLogController currently maps to [Route("api/")]
  private primaryUrl = `${environment.apiUrl}/api`;
  private Url = `${environment.apiUrl}/api/auditlog`;

  getAuditLogs(
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<PagedResult<AuditLogDto>> {
    const params = { pageNumber, pageSize };

     return this.http.get<PagedResult<AuditLogDto>>
      (this.Url, { params });
  }
}
