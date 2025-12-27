import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HeartRateService, HeartRateReading } from '../../core/services/heart-rate.service';
import { interval, Subscription } from 'rxjs';

type MeasurementState =
  | 'initializing'      // Enabling sensor
  | 'waiting_finger'    // Sensor ready, waiting for finger
  | 'finger_detected'   // Finger just detected
  | 'measuring'         // Actively measuring (0-15s)
  | 'completed'         // Measurement complete, showing results
  | 'error';            // Error occurred

@Component({
  selector: 'app-heart-rate',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './heart-rate.component.html',
  styleUrls: ['./heart-rate.component.scss']
})
export class HeartRateComponent implements OnInit, OnDestroy {
  // State Management
  state: MeasurementState = 'initializing';
  measurementResult: HeartRateReading | null = null;
  errorMessage: string = '';
  lastUpdated = '';

  // Session tracking
  currentSessionId: number | null = null;

  // Progress tracking
  measurementProgress = 0; // 0-100%
  measurementTimeRemaining = 15; // seconds

  // UI State
  isDisabling = false;
  isRetrying = false;

  private statusPollSubscription?: Subscription;
  private pollInterval = 1000; // Poll every 1 second

  constructor(
    private heartRateService: HeartRateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🫀 Heart Rate Component Initialized');
    this.initializeSensor();
  }

  ngOnDestroy(): void {
    console.log('🔚 Heart Rate Component Destroyed');
    this.cleanup();
  }

  /**
   * Step 1: Initialize sensor and start monitoring
   */
  private initializeSensor(): void {
    console.log('🔄 Initializing sensor...');
    this.state = 'initializing';
    this.errorMessage = '';
    this.measurementResult = null;
    this.currentSessionId = null;

    // Reset status on server first
    this.heartRateService.resetStatus().subscribe({
      next: () => {
        console.log('✅ Status reset on server');
        this.enableSensor();
      },
      error: () => {
        // Continue anyway
        this.enableSensor();
      }
    });
  }

  /**
   * Enable the MAX30105 sensor
   */
  private enableSensor(): void {
    this.heartRateService.enableSensor().subscribe({
      next: (response) => {
        console.log('✅ Sensor enabled:', response);
        this.state = 'waiting_finger';
        this.startStatusMonitoring();
      },
      error: (error) => {
        console.error('❌ Failed to enable sensor:', error);
        this.state = 'error';
        this.errorMessage = 'Failed to initialize sensor. Please check ESP32 connection and ensure it is powered on.';
      }
    });
  }

  /**
   * Step 2: Monitor status from ESP32 in real-time
   */
  private startStatusMonitoring(): void {
    console.log('👀 Starting real-time status monitoring...');

    // Poll status every second for real-time updates
    this.statusPollSubscription = interval(this.pollInterval).subscribe(() => {
      this.checkStatus();
    });
  }

  /**
   * Check current measurement status from server
   */
  private checkStatus(): void {
    this.heartRateService.getStatus().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.handleStatusUpdate(res.data);
        }
      },
      error: (error) => {
        // Silent error - keep polling
        console.log('📡 Polling...');
      }
    });
  }

  /**
   * Handle status update from ESP32
   */
  private handleStatusUpdate(status: any): void {
    const { state, fingerDetected, progress, sessionId, lastReading } = status;

    // Update session ID if new
    if (sessionId && sessionId !== this.currentSessionId) {
      console.log('🆔 New session:', sessionId);
      this.currentSessionId = sessionId;
    }

    // Handle different states
    switch (state) {
      case 'idle':
        // Sensor disabled or reset
        if (this.state !== 'initializing') {
          console.log('⚪ Sensor idle');
        }
        break;

      case 'waiting_finger':
        if (this.state !== 'waiting_finger') {
          console.log('👆 Waiting for finger...');
          this.state = 'waiting_finger';
        }
        // Update finger detection status live
        break;

      case 'finger_detected':
        console.log('✅ Finger detected!');
        this.state = 'finger_detected';
        // Transition to measuring will happen automatically
        break;

      case 'measuring':
        if (this.state !== 'measuring') {
          console.log('🫀 Measurement started!');
          this.state = 'measuring';
        }

        // Update progress in real-time
        this.measurementProgress = progress || 0;
        this.measurementTimeRemaining = Math.max(0, 15 - (progress / 100 * 15));

        console.log(`📊 Progress: ${progress}% | Time remaining: ${this.measurementTimeRemaining.toFixed(1)}s`);
        break;

      case 'completed':
        console.log('✅ Measurement completed!');

        // Try to get the result from lastReading or fetch by session
        if (lastReading && lastReading.sessionId === this.currentSessionId) {
          this.handleMeasurementComplete(lastReading);
        } else {
          // Fetch result by session ID
          this.fetchResultBySession();
        }
        break;

      case 'error':
        console.log('❌ Measurement error');

        if (lastReading && lastReading.error) {
          this.handleMeasurementError(lastReading);
        } else {
          this.state = 'error';
          this.errorMessage = 'Measurement failed. Please try again.';
          this.stopStatusMonitoring();
          this.disableSensorSilently();
        }
        break;
    }
  }

  /**
   * Fetch result by session ID
   */
  private fetchResultBySession(): void {
    if (!this.currentSessionId) return;

    this.heartRateService.getBySessionId(this.currentSessionId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.handleMeasurementComplete(res.data as HeartRateReading);
        }
      },
      error: () => {
        // Fallback to latest
        this.heartRateService.getLatest().subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.handleMeasurementComplete(res.data as HeartRateReading);
            }
          }
        });
      }
    });
  }

  /**
   * Handle successful measurement completion
   */
  private handleMeasurementComplete(reading: HeartRateReading): void {
    console.log('✅ Measurement complete:', reading);

    this.measurementResult = reading;
    this.state = 'completed';
    this.measurementProgress = 100;
    this.updateLastUpdated();

    // Stop polling - we have the result
    this.stopStatusMonitoring();

    // Auto-disable sensor after 3 seconds
    setTimeout(() => {
      if (this.state === 'completed') {
        this.disableSensorSilently();
      }
    }, 3000);
  }

  /**
   * Handle measurement error
   */
  private handleMeasurementError(reading: HeartRateReading): void {
    console.log('❌ Measurement failed:', reading.error);

    this.state = 'error';
    this.errorMessage = reading.error || 'Measurement failed. Please ensure your finger is properly placed on the sensor.';

    // Stop polling
    this.stopStatusMonitoring();

    // Auto-disable sensor
    this.disableSensorSilently();
  }

  /**
   * Stop status monitoring
   */
  private stopStatusMonitoring(): void {
    if (this.statusPollSubscription) {
      console.log('🛑 Stopping status monitoring');
      this.statusPollSubscription.unsubscribe();
      this.statusPollSubscription = undefined;
    }
  }

  /**
   * Silently disable sensor in background
   */
  private disableSensorSilently(): void {
    console.log('🔇 Disabling sensor silently...');
    this.heartRateService.disableSensor().subscribe({
      next: () => console.log('✅ Sensor disabled'),
      error: (err) => console.error('⚠️ Failed to disable sensor:', err)
    });
  }

  /**
   * Handle back button click
   */
  onBackClick(): void {
    if (this.isDisabling) return;

    console.log('🔙 Back button clicked');
    this.isDisabling = true;
    this.cleanup();

    // Disable sensor before navigating away
    this.heartRateService.disableSensor().subscribe({
      next: () => {
        console.log('✅ Sensor disabled, navigating back');
        this.router.navigate(['/']);
      },
      error: () => {
        console.log('⚠️ Error disabling, navigating anyway');
        this.router.navigate(['/']);
      }
    });
  }

  /**
   * Retry measurement after error
   */
  onRetry(): void {
    if (this.isRetrying) return;

    console.log('🔄 Retry button clicked');
    this.isRetrying = true;
    this.errorMessage = '';
    this.measurementResult = null;
    this.measurementProgress = 0;
    this.currentSessionId = null;

    // First disable the sensor
    this.heartRateService.disableSensor().subscribe({
      next: () => {
        console.log('✅ Sensor disabled for retry');
        // Wait a moment then restart
        setTimeout(() => {
          this.isRetrying = false;
          this.initializeSensor();
        }, 1000);
      },
      error: () => {
        console.log('⚠️ Error during retry, restarting anyway');
        setTimeout(() => {
          this.isRetrying = false;
          this.initializeSensor();
        }, 1000);
      }
    });
  }

  /**
   * Cleanup when component is destroyed
   */
  private cleanup(): void {
    console.log('🧹 Cleaning up...');
    this.stopStatusMonitoring();
  }

  /**
   * Update last updated timestamp
   */
  private updateLastUpdated(): void {
    this.lastUpdated = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // ==================== CATEGORY HELPERS ====================

  /**
   * Get heart rate category text
   */
  getHeartRateCategory(): string {
    if (this.heartRate < 60) return 'Bradycardia';
    if (this.heartRate >= 60 && this.heartRate <= 100) return 'Normal Range';
    if (this.heartRate > 100 && this.heartRate <= 120) return 'Elevated';
    return 'Tachycardia';
  }

  /**
   * Get blood pressure category text
   */
  getBloodPressureCategory(): string {
    if (this.systolic < 90 || this.diastolic < 60) {
      return 'Hypotension (Low)';
    }
    if (this.systolic < 120 && this.diastolic < 80) {
      return 'Normal Range';
    }
    if (this.systolic < 130 && this.diastolic < 80) {
      return 'Elevated';
    }
    if (this.systolic < 140 || this.diastolic < 90) {
      return 'Stage 1 Hypertension';
    }
    return 'Stage 2 Hypertension';
  }

  // ==================== COMPUTED PROPERTIES ====================

  get heartRate(): number {
    return this.measurementResult?.heartRate ?? 0;
  }

  get systolic(): number {
    return this.measurementResult?.systolic ?? 0;
  }

  get diastolic(): number {
    return this.measurementResult?.diastolic ?? 0;
  }

  get bloodPressure(): string {
    if (this.systolic && this.diastolic) {
      return `${this.systolic}/${this.diastolic}`;
    }
    return '--/--';
  }

  get statusClass(): string {
    switch (this.state) {
      case 'initializing':
        return 'status-initializing';
      case 'waiting_finger':
        return 'status-waiting';
      case 'finger_detected':
      case 'measuring':
        return 'status-measuring';
      case 'completed':
        if (this.heartRate < 60 || this.heartRate > 100) {
          return 'status-alert';
        }
        return 'status-normal';
      case 'error':
        return 'status-error';
      default:
        return 'status-waiting';
    }
  }

  get statusText(): string {
    switch (this.state) {
      case 'initializing':
        return 'INITIALIZING SENSOR';
      case 'waiting_finger':
        return 'PLACE YOUR FINGER';
      case 'finger_detected':
        return 'FINGER DETECTED';
      case 'measuring':
        return 'MEASURING...';
      case 'completed':
        if (this.heartRate < 60) return 'LOW HEART RATE';
        if (this.heartRate > 100) return 'HIGH HEART RATE';
        return 'NORMAL RANGE';
      case 'error':
        return 'MEASUREMENT FAILED';
      default:
        return 'WAITING';
    }
  }

  get showWaitingState(): boolean {
    return this.state === 'initializing' || this.state === 'waiting_finger';
  }

  get showMeasuringState(): boolean {
    return this.state === 'finger_detected' || this.state === 'measuring';
  }

  get showResults(): boolean {
    return this.state === 'completed' && this.measurementResult !== null;
  }

  get showError(): boolean {
    return this.state === 'error';
  }

  get progressPercentage(): number {
    return Math.min(100, Math.max(0, this.measurementProgress));
  }

  get timeRemainingText(): string {
    return Math.ceil(this.measurementTimeRemaining) + 's';
  }
}
