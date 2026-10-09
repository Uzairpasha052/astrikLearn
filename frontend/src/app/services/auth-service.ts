// import { Injectable } from '@angular/core';
import { environment } from '../environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface RegisterRequest {
    name: string,
    email : string,
    password: string,
    role : string
}

export interface LoginRequest {
    mail : string,
    password: string,
}

export interface AuthResponse {
  message: string;
  token: string,
  user: User;
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

    getLoginUser(): Observable<UserDisplay[]>{
        return this.http.get<UserDisplay[]>(
            `${this.url}/users`
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

//   logout(): void {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//   }
}
