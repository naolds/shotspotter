import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";

import { catchError, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class StreetViewService {
    private apiUrl = 'http://localhost:5000/get_street_view';

    constructor(private http: HttpClient) {}

    getStreetViewImage(lat: number, lng: number): Observable<Blob> {
        console.log('Coordinates from service:', { lat, lng });
        return this.http.post(this.apiUrl,
            {
                lat,
                lng
            },
            {
                responseType: 'blob'
            }
        ).pipe(
            tap(response => {
              console.log('Received response:', response);
              console.log('Response type:', response.type);
              console.log('Response size:', response.size);
            }),
            catchError(this.handleError)
        );
    }
    private handleError(error: HttpErrorResponse) {
        console.error('Error:', {
            status: error.status,
            message: error.message,
            error: error.error
        });
        return throwError(() => new Error('Something went wrong.'));
      }
}