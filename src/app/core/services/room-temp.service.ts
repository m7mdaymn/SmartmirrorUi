import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../constant/api-endpoints';

export interface RoomTempReading {
  id: number;
  temperature: number;     // Room temperature
  humidity: number;        // Relative humidity in %
  unit: string;            // 'C' or 'F' (defaults to 'C')
  timestamp: string;
  deviceId: string;
}

export interface RoomTempApiResponse {
  success: boolean;
  message?: string;
  data?: RoomTempReading | RoomTempReading[];
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
export class RoomTempService {

  constructor(private http: HttpClient) { }

  /**
   * Send new room temperature & humidity reading from ESP32 (DHT22)
   * Required: temperature, humidity
   * Optional: unit ('C' or 'F'), deviceId
   */
  sendReading(data: {
    temperature: number;
    humidity: number;
    unit?: 'C' | 'F';
    deviceId?: string;
  }): Observable<RoomTempApiResponse> {
    return this.http.post<RoomTempApiResponse>(API_ENDPOINTS.roomTemp.create, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get the latest room temperature & humidity reading
   */
  getLatest(): Observable<RoomTempApiResponse> {
    return this.http.get<RoomTempApiResponse>(API_ENDPOINTS.roomTemp.latest).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get recent readings (with optional limit)
   */
  getAll(limit: number = 50): Observable<RoomTempApiResponse> {
    const url = `${API_ENDPOINTS.roomTemp.getAll}?limit=${limit}`;
    return this.http.get<RoomTempApiResponse>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Disable the DHT22 sensor
   * Sends POST request to /api/control/sensor/dht22 with {enabled: false}
   */
  disableSensor(): Observable<SensorControlResponse> {
    return this.http.post<SensorControlResponse>(
      API_ENDPOINTS.control.disableSensor('dht22'),
      { enabled: false }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Enable the DHT22 sensor
   * Sends POST request to /api/control/sensor/dht22 with {enabled: true}
   */
  enableSensor(): Observable<SensorControlResponse> {
    return this.http.post<SensorControlResponse>(
      API_ENDPOINTS.control.enableSensor('dht22'),
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

    console.error('RoomTempService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
