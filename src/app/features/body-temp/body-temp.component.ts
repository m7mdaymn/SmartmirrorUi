import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HumanTempService, HumanTempReading } from '../../core/services/human-temp.service';
import { interval, Subscription, switchMap } from 'rxjs';

@Component({
  selector: 'app-body-temp',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './body-temp.component.html',
  styleUrls: ['./body-temp.component.scss']
})
export class BodyTempComponent implements OnInit, OnDestroy {
  latestReading: HumanTempReading | null = null;
  loading = true;
  error: string | null = null;
  lastUpdated: string = '';

  private pollSubscription!: Subscription;

  constructor(private humanTempService: HumanTempService) {}

  ngOnInit(): void {
    // Poll every 8 seconds
    this.pollSubscription = interval(8000)
      .pipe(switchMap(() => this.humanTempService.getLatest()))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.latestReading = res.data as HumanTempReading;
            this.updateLastUpdated();
            this.loading = false;
            this.error = null;
          } else {
            this.error = 'No temperature data yet';
            this.loading = false;
          }
        },
        error: () => {
          this.error = 'Sensor not enabled';
          this.loading = false;
        }
      });

    this.loadLatest(); // Initial fetch
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  loadLatest(): void {
    this.loading = true;
    this.humanTempService.getLatest().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.latestReading = res.data as HumanTempReading;
          this.updateLastUpdated();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'MLX90614 sensor offline';
        this.loading = false;
      }
    });
  }

  updateLastUpdated(): void {
    if (this.latestReading?.timestamp) {
      const date = new Date(this.latestReading.timestamp);
      this.lastUpdated = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  }

  // === Real Data Getters ===
  get bodyTemp(): number {
    return this.latestReading?.objectTemp ?? 0;
  }

  get ambientTemp(): number {
    return this.latestReading?.ambientTemp ?? 0;
  }

  get unit(): string {
    return this.latestReading?.unit ?? 'C';
  }

  // === Status & Classes ===
  get tempStatus(): string {
    if (this.bodyTemp >= 38.0) return 'FEVER';
    if (this.bodyTemp >= 37.3) return 'ELEVATED';
    if (this.bodyTemp >= 36.0) return 'NORMAL';
    return 'LOW';
  }

  get tempStatusClass(): string {
    switch (this.tempStatus) {
      case 'FEVER': return 'status-fever';
      case 'ELEVATED': return 'status-elevated';
      case 'NORMAL': return 'status-normal';
      default: return 'status-low';
    }
  }

  get tempIcon(): string {
    switch (this.tempStatus) {
      case 'FEVER': return '🤒';
      case 'ELEVATED': return '😓';
      case 'NORMAL': return '😊';
      default: return '🥶';
    }
  }

  get connectionStatus(): string {
    if (this.loading) return 'connecting';
    if (this.error) return 'offline';
    return 'online';
  }

  get connectionStatusText(): string {
    if (this.loading) return 'Connecting...';
    if (this.error) return 'Sensor Off';
    return 'Live Reading';
  }

  // === Thermometer Visualization ===
  get mercuryHeight(): number {
    // Map 35°C → 0%, 39°C → 100%
    return Math.max(0, Math.min(100, ((this.bodyTemp - 35) / 4) * 100));
  }

  get isFever(): boolean {
    return this.bodyTemp >= 38.0;
  }

  get isElevated(): boolean {
    return this.bodyTemp >= 37.3 && this.bodyTemp < 38.0;
  }
}
