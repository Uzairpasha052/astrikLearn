// import { Injectable } from '@angular/core';
import { environment } from '../environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PagedResult } from '../model/pagination.model';

export interface RegisterRequest {
    name: string,
    email : string,
    password: string,
    role : number
}

export interface LoginRequest {
    mail : string,
    password: string,
}

export interface AuthResponse extends User{
//   message: string;
  token: string,
//   user: User;
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

    private url = `${environment.apiUrl}/api/auth`

    constructor( private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object
    ){}

    register(data: RegisterRequest): Observable<AuthResponse>{
        return this.http.post<AuthResponse>(
            `${this.url}/register`,
            data
        )
    }

    login(data: LoginRequest): Observable<AuthResponse>{
        return this.http.post<AuthResponse>(
            `${this.url}/login`,
            data
        )
    }

    getLoginUser(
        pageNumber: number = 1,
        pageSize: number = 10
    ): Observable<PagedResult<UserDisplay>>{
        return this.http.get<PagedResult<UserDisplay>>(
            `${this.url}/users`,
            {
                params: {pageNumber, pageSize}
            }
        )
    }

    //For further use
    getToken(): string | null {
        if(isPlatformBrowser(this.platformId)){
            return localStorage.getItem('token')
        }
        return null
    }
    
    getUser(): User | null {

        if (!isPlatformBrowser(this.platformId)) {
            return null;
        }
        const user = localStorage.getItem('user')

        if(!user){
            return null
        }

        return JSON.parse(user)
    }
    getRole(): string | null {
    return this.getUser()?.role ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(...roles: string[]): boolean{
    const role = this.getRole();
    return !!role && roles.includes(role)
  }

//   logout(): void {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//   }
}
