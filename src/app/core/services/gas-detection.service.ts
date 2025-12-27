import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../constant/api-endpoints';

export interface GasReading {
  id: number;
  rawValue: number;
  voltage?: number;
  resistance?: number;
  co2_ppm: number;
  co2_percentage: number;
  co2_status: string;
  smoke_level: number;
  smoke_status: string;
  aqi_score: number;
  overall_quality: string;
  timestamp: string;
  deviceId: string;
}

export interface GasApiResponse {
  success: boolean;
  message?: string;
  data?: GasReading | GasReading[];
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
export class GasDetectionService {

  constructor(private http: HttpClient) { }

  sendReading(data: {
    rawValue: number;
    voltage?: number;
    resistance?: number;
    co2_ppm: number;
    co2_percentage: number;
    co2_status: string;
    smoke_level: number;
    smoke_status: string;
    aqi_score: number;
    overall_quality: string;
    deviceId?: string;
  }): Observable<GasApiResponse> {
    return this.http.post<GasApiResponse>(API_ENDPOINTS.gas.create, data).pipe(
      catchError(this.handleError)
    );
  }

  getLatest(): Observable<GasApiResponse> {
    return this.http.get<GasApiResponse>(API_ENDPOINTS.gas.latest).pipe(
      catchError(this.handleError)
    );
  }

  getAll(limit: number = 50): Observable<GasApiResponse> {
    const url = `${API_ENDPOINTS.gas.getAll}?limit=${limit}`;
    return this.http.get<GasApiResponse>(url).pipe(
      catchError(this.handleError)
    );
  }

  disableSensor(): Observable<SensorControlResponse> {
    return this.http.post<SensorControlResponse>(
      API_ENDPOINTS.control.disableSensor('mq135'),
      { enabled: false }
    ).pipe(
      catchError(this.handleError)
    );
  }

  enableSensor(): Observable<SensorControlResponse> {
    return this.http.post<SensorControlResponse>(
      API_ENDPOINTS.control.enableSensor('mq135'),
      { enabled: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || error.message || `Server Error: ${error.status}`;
    }

    console.error('GasDetectionService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
