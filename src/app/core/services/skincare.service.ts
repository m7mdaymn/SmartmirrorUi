import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { API_ENDPOINTS } from '../constant/api-endpoints';

// Backend response interface
export interface SkincareAnalysisResponse {
  success: boolean;
  message?: string;
  disclaimer?: string;
  data?: {
    skinType: string;
    condition: string;
    morningRoutine: string[];
    nightRoutine: string[];
    recommendedIngredients: string[];
    avoidIngredients: string[];
    lifestyleTips: string[];
  };
  aiMessage?: string;
  detectedSkin?: {
    skinType: string;
    condition: string;
  };
  aiAnalysis?: {
    detected: boolean;
    confidence: number;
    regions_analyzed: number;
    capturedImage?: string;
    skin_type_distribution?: any;
    condition_distribution?: any;
    message: string;
  };
  warning?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SkincareService {

  constructor(private http: HttpClient) { }

  /**
   * Trigger AI skin analysis
   * Calls backend which then calls Python AI service
   * Returns skincare recommendations
   */
  analyzeSkin(): Observable<SkincareAnalysisResponse> {
    console.log('🔬 Calling skincare AI analysis API:', API_ENDPOINTS.skincare.analyze);

    return this.http.post<SkincareAnalysisResponse>(
      API_ENDPOINTS.skincare.analyze,
      {} // Empty body - backend handles camera via Python
    ).pipe(
      tap(response => {
        console.log('✅ AI Analysis Response received:', {
          success: response.success,
          skinType: response.data?.skinType,
          condition: response.data?.condition,
          hasRecommendations: !!response.data,
          message: response.message || response.aiMessage
        });
      }),
      catchError(error => {
        console.error('❌ API Error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Check if skincare API is running
   */
  checkStatus(): Observable<{ success: boolean; message: string }> {
    return this.http.get<{ success: boolean; message: string }>(
      API_ENDPOINTS.skincare.status
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Centralized error handling with user-friendly messages
   */
  private handleError(error: any): Observable<never> {
    let userMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      userMessage = 'Network error. Please check your connection.';
    } else if (error.status === 0) {
      userMessage = 'Cannot connect to server. Make sure the backend is running on port 5000.';
    } else if (error.status === 400) {
      userMessage = error.error?.message || 'No face detected. Please face the mirror clearly.';
    } else if (error.status === 404) {
      userMessage = error.error?.message || 'No skincare routine found for your skin type.';
    } else if (error.status === 500) {
      if (error.error?.message?.includes('AI Service')) {
        userMessage = 'AI Service error. Make sure Python server is running on port 8000.';
      } else {
        userMessage = error.error?.message || 'Server error occurred';
      }
    } else {
      userMessage = error.error?.message || `Server Error: ${error.status}`;
    }

    console.error('❌ SkincareService Error:', {
      status: error.status,
      statusText: error.statusText,
      message: userMessage,
      url: error.url,
      fullError: error
    });

    return throwError(() => new Error(userMessage));
  }
}