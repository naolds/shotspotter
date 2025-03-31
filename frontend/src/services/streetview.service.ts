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

    saveStreetViewImage(lat: number, lng: number, heading: number, imageData: string): void {
        const data = {
            lat: lat,
            lng: lng,
            heading: heading,
            imageData: imageData // Base64 encoded image
          };

        console.log(data);
    
        // Replace with your Python backend API endpoint
        const backendUrl = 'http://localhost:5000/save_location';

        this.http.post(backendUrl, data).pipe(
            tap(response => {
                console.log('Received response:', response);
            }),
            catchError(this.handleError)
        ).subscribe();
    }

    getStreetViewImage(lat: number, lng: number, heading: number): Observable<Blob> {
        console.log('Coordinates from service:', { lat, lng });
        return this.http.post(this.apiUrl,
            {
                lat,
                lng,
                heading
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