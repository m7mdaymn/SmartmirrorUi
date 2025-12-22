import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../constant/api-endpoints';

export interface HeartRateReading {
  id: number;
  heartRate: number;
  systolic: number;
  diastolic: number;
  fingerDetected?: boolean;
  spo2?: number | null;
  timestamp: string;
  deviceId: string;
}

export interface HeartRateApiResponse {
  success: boolean;
  message?: string;
  data?: HeartRateReading | HeartRateReading[];
  count?: number;
}

export interface SensorControlResponse {
  success: boolean;
  message?: string;
  sensor?: string;
  enabled?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HeartRateService {

  constructor(private http: HttpClient) { }

  /**
   * Send new heart rate reading from ESP32 to backend
   * Required: heartRate, systolic, diastolic
   * Optional: fingerDetected, spo2, deviceId
   */
  sendReading(data: {
    heartRate: number;
    systolic: number;
    diastolic: number;
    fingerDetected?: boolean;
    spo2?: number;
    deviceId?: string;
  }): Observable<HeartRateApiResponse> {
    return this.http.post<HeartRateApiResponse>(API_ENDPOINTS.heartRate.create, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get the latest heart rate reading
   */
  getLatest(): Observable<HeartRateApiResponse> {
    return this.http.get<HeartRateApiResponse>(API_ENDPOINTS.heartRate.latest).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get recent heart rate readings (with optional limit)
   */
  getAll(limit: number = 50): Observable<HeartRateApiResponse> {
    const url = `${API_ENDPOINTS.heartRate.getAll}?limit=${limit}`;
    return this.http.get<HeartRateApiResponse>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Disable the MAX30105 heart rate sensor
   * Sends POST request to /api/control/sensor/max30105 with {enabled: false}
   */
  disableSensor(): Observable<SensorControlResponse> {
    return this.http.post<SensorControlResponse>(
      API_ENDPOINTS.control.disableSensor('max30105'),
      { enabled: false }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Enable the MAX30105 heart rate sensor
   * Sends POST request to /api/control/sensor/max30105 with {enabled: true}
   */
  enableSensor(): Observable<SensorControlResponse> {
    return this.http.post<SensorControlResponse>(
      API_ENDPOINTS.control.enableSensor('max30105'),
      { enabled: true }
    ).pipe(
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

    console.error('HeartRateService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
