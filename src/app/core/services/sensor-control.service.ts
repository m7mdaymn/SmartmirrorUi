import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../constant/api-endpoints';

export interface SensorStatus {
  dht22: boolean;
  mlx90614: boolean;
  mq135: boolean;
  max30105: boolean;
}

export interface ControlResponse {
  success: boolean;
  message: string;
  sensors?: SensorStatus;
}

@Injectable({
  providedIn: 'root'
})
export class SensorControlService {

  constructor(private http: HttpClient) { }

  /** Get current status of all sensors */
  getStatus(): Observable<ControlResponse> {
    return this.http.get<ControlResponse>(API_ENDPOINTS.control.status).pipe(
      catchError(this.handleError)
    );
  }

  /** Enable all sensors */
  enableAll(): Observable<ControlResponse> {
    return this.http.post<ControlResponse>(API_ENDPOINTS.control.enableAll, {}).pipe(
      catchError(this.handleError)
    );
  }

  /** Disable all sensors */
  disableAll(): Observable<ControlResponse> {
    return this.http.post<ControlResponse>(API_ENDPOINTS.control.disableAll, {}).pipe(
      catchError(this.handleError)
    );
  }

  /** Enable or disable a specific sensor */
  toggleSensor(sensorName: 'dht22' | 'mlx90614' | 'mq135' | 'max30105', enabled: boolean): Observable<ControlResponse> {
    const url = API_ENDPOINTS.control.toggleSensor(sensorName);
    return this.http.post<ControlResponse>(url, { enabled }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('SensorControlService Error:', error);
    const message = error.error?.message || 'Failed to control sensor';
    return throwError(() => new Error(message));
  }
}
