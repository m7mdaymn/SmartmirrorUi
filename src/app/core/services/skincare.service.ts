import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../constant/api-endpoints';

export interface SkincareReading {
  id: number;
  skinTemp: number;          // Skin temperature (from MLX90614 object temp)
  ambientTemp: number;       // Ambient temperature
  humidity: number;          // Room humidity (%)
  recommendation?: string | null;  // Optional skincare recommendation
  timestamp: string;
  deviceId: string;
}

export interface SkincareApiResponse {
  success: boolean;
  message?: string;
  data?: SkincareReading | SkincareReading[];
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SkincareService {

  constructor(private http: HttpClient) { }

  /**
   * Send new skincare data (combined from sensors)
   * Required: skinTemp, ambientTemp, humidity
   * Optional: recommendation, deviceId
   */
  sendReading(data: {
    skinTemp: number;
    ambientTemp: number;
    humidity: number;
    recommendation?: string;
    deviceId?: string;
  }): Observable<SkincareApiResponse> {
    return this.http.post<SkincareApiResponse>(API_ENDPOINTS.skincare.create, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get the latest skincare reading with recommendation
   */
  getLatest(): Observable<SkincareApiResponse> {
    return this.http.get<SkincareApiResponse>(API_ENDPOINTS.skincare.latest).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get recent skincare readings (with optional limit)
   */
  getAll(limit: number = 50): Observable<SkincareApiResponse> {
    const url = `${API_ENDPOINTS.skincare.getAll}?limit=${limit}`;
    return this.http.get<SkincareApiResponse>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Centralized error handling
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

    console.error('SkincareService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
