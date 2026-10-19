import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import {
  ReminderDisplayDto,
  CreateReminderDto,
  UpdateReminderDto
} from '../../model/Reminder.model';
import { PagedResult } from '../../model/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private url = `${environment.apiUrl}/api/reminder`;

  constructor(private http: HttpClient) {}

  getReminders(
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<PagedResult<ReminderDisplayDto>> {
    return this.http.get<PagedResult<ReminderDisplayDto>>(this.url, {
      params: { pageNumber, pageSize }
    });
  }

  getReminderById(id: number): Observable<ReminderDisplayDto> {
    return this.http.get<ReminderDisplayDto>(`${this.url}/${id}`);
  }

  createReminder(dto: CreateReminderDto): Observable<ReminderDisplayDto> {
    return this.http.post<ReminderDisplayDto>(this.url, dto);
  }

  updateReminder(id: number, dto: UpdateReminderDto): Observable<ReminderDisplayDto> {
    return this.http.put<ReminderDisplayDto>(`${this.url}/${id}`, dto);
  }

  deleteReminder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
