import { environment } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { inject, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CustomerDto, CreateCustomerDto, UpdateCustomerDto, CustomerResponse } from '../../model/Customer.model';


@Injectable({
    providedIn: 'root'
})
export class CustomerService {

    private url = `${environment.apiUrl}/api/customer`

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: object
    ){}

    getCustomers(): Observable<CustomerDto[]>{
        return this.http.get<CustomerDto[]>(
            `${this.url}`
        )
    }
    //Unnecessary
    getCustomerById(id: number): Observable<CustomerDto>{
        return this.http.get<CustomerDto>(
            `${this.url}`
        )
    }

    createCustomer(dto: CreateCustomerDto): Observable<CustomerResponse>{
        return this.http.post<CustomerResponse>(
            `${this.url}`, dto
        );
    }
 
    updateCustomer(id: number, dto: UpdateCustomerDto): Observable<CustomerResponse>{
        return this.http.put<CustomerResponse>(
            `${this.url}/${id}`, dto
        );
    }
 
    deleteCustomer(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(
            `${this.url}/${id}`
        );
    }

}
