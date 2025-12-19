import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoomTempService, RoomTempReading } from '../../core/services/room-temp.service';
import { interval, Subscription, switchMap } from 'rxjs';

@Component({
  selector: 'app-room-temp',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './room-temp.component.html',
  styleUrls: ['./room-temp.component.scss']
})
export class RoomTempComponent implements OnInit, OnDestroy {
  latestReading: RoomTempReading | null = null;
  loading = true;
  error: string | null = null;
  lastUpdated: string = '';

  private pollSubscription!: Subscription;

  constructor(private roomTempService: RoomTempService) {}

  ngOnInit(): void {
    // Poll every 8 seconds (ESP32 sends data every 10s)
    this.pollSubscription = interval(8000)
      .pipe(
        switchMap(() => this.roomTempService.getLatest())
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.latestReading = response.data as RoomTempReading;
            this.updateLastUpdated();
            this.loading = false;
            this.error = null;
          } else {
            this.error = 'No data received yet';
            this.loading = false;
          }
        },
        error: (err) => {
          this.error = 'Failed to connect to sensor';
          this.loading = false;
          console.error('Room temp polling error:', err);
        }
      });

    // Initial load
    this.loadLatest();
  }

  ngOnDestroy(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
  }

  loadLatest(): void {
    this.loading = true;
    this.roomTempService.getLatest().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.latestReading = response.data as RoomTempReading;
          this.updateLastUpdated();
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Sensor offline or not enabled';
        this.loading = false;
      }
    });
  }

  updateLastUpdated(): void {
    if (this.latestReading?.timestamp) {
      const date = new Date(this.latestReading.timestamp);
      this.lastUpdated = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  }

  // Helper getters for template
  get temperature(): number {
    return this.latestReading?.temperature ?? 0;
  }

  get humidity(): number {
    return this.latestReading?.humidity ?? 0;
  }

  get unit(): string {
    return this.latestReading?.unit ?? 'C';
  }

  get connectionStatus(): string {
    if (this.loading) return 'connecting';
    if (this.error) return 'offline';
    return 'online';
  }

  get connectionStatusText(): string {
    switch (this.connectionStatus) {
      case 'online': return 'Connected';
      case 'connecting': return 'Connecting...';
      default: return 'Offline';
    }
  }

  get tempPercentage(): number {
    const temp = this.temperature;
    return Math.max(0, Math.min(100, ((temp - 16) / 14) * 100)); // 16–30°C range
  }

  get humidityPercentage(): number {
    return Math.max(0, Math.min(100, this.humidity));
  }

  get comfortLevel(): string {
    const temp = this.temperature;
    const hum = this.humidity;

    if (temp >= 18 && temp <= 26 && hum >= 40 && hum <= 60) {
      return 'Very Comfortable';
    }
    if (temp >= 16 && temp <= 28 && hum >= 30 && hum <= 70) {
      return 'Comfortable';
    }
    return 'Needs Adjustment';
  }

  get comfortColor(): string {
    switch (this.comfortLevel) {
      case 'Very Comfortable': return '#2ecc71';
      case 'Comfortable': return '#f39c12';
      default: return '#e74c3c';
    }
  }
}
