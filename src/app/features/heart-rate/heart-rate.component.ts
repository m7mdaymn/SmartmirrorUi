import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeartRateService, HeartRateReading } from '../../core/services/heart-rate.service';
import { interval, Subscription, switchMap } from 'rxjs';

@Component({
  selector: 'app-heart-rate',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './heart-rate.component.html',
  styleUrls: ['./heart-rate.component.scss']
})
export class HeartRateComponent implements OnInit, OnDestroy {
  latestReading: HeartRateReading | null = null;
  loading = true;
  error: string | null = null;
  lastUpdated = '';
  fingerDetected = false;

  private pollSubscription!: Subscription;

  constructor(private heartRateService: HeartRateService) {}

  ngOnInit(): void {
    // Poll every 3 seconds — MAX30105 sends data only after ~9s measurement
    this.pollSubscription = interval(3000)
      .pipe(switchMap(() => this.heartRateService.getLatest()))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.latestReading = res.data as HeartRateReading;
            this.fingerDetected = true;
            this.loading = false;
            this.error = null;
            this.updateLastUpdated();
          } else {
            // No reading yet — still waiting for finger
            this.fingerDetected = false;
            this.loading = true;
          }
        },
        error: () => {
          this.error = 'Waiting for finger on sensor...';
          this.fingerDetected = false;
        }
      });

    // Initial check
    this.checkLatest();
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  checkLatest(): void {
    this.heartRateService.getLatest().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.latestReading = res.data as HeartRateReading;
          this.fingerDetected = true;
          this.loading = false;
          this.updateLastUpdated();
        }
      }
    });
  }

  updateLastUpdated(): void {
    this.lastUpdated = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // === Getters ===
  get heartRate(): number {
    return this.latestReading?.heartRate ?? 0;
  }

  get systolic(): number {
    return this.latestReading?.systolic ?? 0;
  }

  get diastolic(): number {
    return this.latestReading?.diastolic ?? 0;
  }

  get oxygenLevel(): number {
    return this.latestReading?.spo2 ?? 0;
  }

  get restingHeartRate(): number {
    return this.heartRate > 0 ? Math.round(this.heartRate * 0.9) : 68;
  }

  get hrv(): number {
    return Math.round(35 + Math.random() * 20); // Simulated HRV
  }

  get maxToday(): number {
    return this.heartRate + 15;
  }

  get minToday(): number {
    return this.heartRate - 10;
  }

  get statusClass(): string {
    if (!this.fingerDetected) return 'status-waiting';
    if (this.heartRate < 60 || this.heartRate > 100) return 'status-alert';
    return 'status-normal';
  }

  get statusText(): string {
    if (!this.fingerDetected) return 'PLACE FINGER';
    if (this.heartRate < 60) return 'LOW';
    if (this.heartRate > 100) return 'HIGH';
    return 'NORMAL';
  }

  get pulseAnimation(): boolean {
    return this.fingerDetected && this.heartRate > 0;
  }
}
