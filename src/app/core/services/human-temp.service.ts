import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../constant/api-endpoints';

export interface HumanTempReading {
  id: number;
  objectTemp: number;
  ambientTemp: number;
  unit: string;
  timestamp: string;
  deviceId: string;
}

export interface HumanTempApiResponse {
  success: boolean;
  message?: string;
  data?: HumanTempReading | HumanTempReading[];
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
export class HumanTempService {

  constructor(private http: HttpClient) { }

  /**
   * Send new human/skin temperature reading from ESP32 (MLX90614)
   * Required: objectTemp, ambientTemp
   * Optional: unit ('C' or 'F'), deviceId
   */
  sendReading(data: {
    objectTemp: number;
    ambientTemp: number;
    unit?: 'C' | 'F';
    deviceId?: string;
  }): Observable<HumanTempApiResponse> {
    return this.http.post<HumanTempApiResponse>(API_ENDPOINTS.humanTemp.create, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get the latest human temperature reading
   */
  getLatest(): Observable<HumanTempApiResponse> {
    return this.http.get<HumanTempApiResponse>(API_ENDPOINTS.humanTemp.latest).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get recent human temperature readings (with optional limit)
   */
  getAll(limit: number = 50): Observable<HumanTempApiResponse> {
    const url = `${API_ENDPOINTS.humanTemp.getAll}?limit=${limit}`;
    return this.http.get<HumanTempApiResponse>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Disable the MLX90614 human temperature sensor
   * Sends POST request to /api/control/sensor/mlx90614 with {enabled: false}
   */
  disableSensor(): Observable<SensorControlResponse> {
    return this.http.post<SensorControlResponse>(
      API_ENDPOINTS.control.disableSensor('mlx90614'),
      { enabled: false }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Enable the MLX90614 human temperature sensor
   * Sends POST request to /api/control/sensor/mlx90614 with {enabled: true}
   */
  enableSensor(): Observable<SensorControlResponse> {
    return this.http.post<SensorControlResponse>(
      API_ENDPOINTS.control.enableSensor('mlx90614'),
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

    console.error('HumanTempService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
