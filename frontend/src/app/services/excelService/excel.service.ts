import { Injectable } from "@angular/core";
import { environment } from "../../environment/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class ExcelService{

    private url = `${environment.apiUrl}/api/customer/excel`;

    constructor(private http: HttpClient){}

    customerExport(): Observable<Blob>{
        return this.http.get(
            `${this.url}/export`,{
                responseType: 'blob'
            })
    }

    customerImport(file: File): Observable<{ message: string}>{
        const formData = new FormData()
        formData.append('file', file)

        return this.http.post<{ message: string}>(
            `${this.url}/import`,
            formData
        )
    }

}
