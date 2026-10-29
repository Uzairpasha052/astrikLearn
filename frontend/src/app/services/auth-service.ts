import { environment } from '../environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PagedResult } from '../model/pagination.model';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: number;
}

export interface LoginRequest {
  mail: string;
  password: string;
}

export interface AuthResponse extends User {
  token: string;
}

export interface User {
  id: number;
  name: string;
  mail: string;
  role: string;
}

export interface UserDisplay {
  id: number;
  name: string;
  email: string;
  role: string;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private url = `${environment.apiUrl}/api/auth`;
  private userUrl = `${environment.apiUrl}/api/user`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  register(data: RegisterRequest): Observable<UserDisplay> {
    return this.http.post<UserDisplay>(`${this.url}/register`, data);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.url}/login`, data);
  }

  getLoginUser(
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<PagedResult<UserDisplay>> {
    return this.http.get<PagedResult<UserDisplay>>(`${this.userUrl}`, {
      params: { pageNumber, pageSize }
    });
  }

   // Delete a user by ID
  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.userUrl}/${id}`);
  }

  // Update a user by ID (partial data)
  updateUser(id: number, dto: Partial<UserDisplay>): Observable<UserDisplay> {
    return this.http.put<UserDisplay>(`${this.userUrl}/${id}`, dto);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  getUser(): User | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const user = localStorage.getItem('user');
    if (!user) {
      return null;
    }
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  }

  getRole(): string | null {
    return this.getUser()?.role ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(...roles: string[]): boolean {
    const role = this.getRole();
    return !!role && roles.includes(role);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
}
