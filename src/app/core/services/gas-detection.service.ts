import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../constant/api-endpoints';
export interface GasReading {
  id: number;
  rawValue: number;
  quality: string;
  ppm?: number | null;
  timestamp: string;
  deviceId: string;
}

export interface GasApiResponse {
  success: boolean;
  message?: string;
  data?: GasReading | GasReading[];
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GasDetectionService {

  constructor(private http: HttpClient) { }

  /**
   * Send new gas reading from ESP32 to backend
   */
  sendReading(data: { rawValue: number; quality: string; ppm?: number; deviceId?: string }): Observable<GasApiResponse> {
    return this.http.post<GasApiResponse>(API_ENDPOINTS.gas.create, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get latest gas reading
   */
  getLatest(): Observable<GasApiResponse> {
    return this.http.get<GasApiResponse>(API_ENDPOINTS.gas.latest).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all gas readings (with optional limit)
   */
  getAll(limit: number = 50): Observable<GasApiResponse> {
    const url = `${API_ENDPOINTS.gas.getAll}?limit=${limit}`;
    return this.http.get<GasApiResponse>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Centralized error handler
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message || `Server Error: ${error.status}`;
    }

    console.error('GasDetectionService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
