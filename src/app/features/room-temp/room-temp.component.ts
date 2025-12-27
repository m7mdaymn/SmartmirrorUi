import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  isDisabling = false;

  // Loading progress properties
  loadingProgress = 0;
  loadingMessage = 'Initializing sensor...';

  private pollSubscription!: Subscription;
  private progressInterval?: any;

  constructor(
    private roomTempService: RoomTempService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Start loading progress animation
    this.startLoadingProgress();

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
            this.completeLoading();
            this.error = null;
          } else {
            this.error = 'No data received yet';
            this.completeLoading();
          }
        },
        error: (err) => {
          this.error = 'Failed to connect to sensor';
          this.completeLoading();
          console.error('Room temp polling error:', err);
        }
      });

    // Initial load with 7-second minimum
    this.loadLatest();
  }

  ngOnDestroy(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  /**
   * Start the 7-second loading progress animation
   */
  startLoadingProgress(): void {
    this.loadingProgress = 0;
    const duration = 7000; // 7 seconds
    const updateInterval = 50; // Update every 50ms
    const totalSteps = duration / updateInterval;
    let currentStep = 0;

    this.progressInterval = setInterval(() => {
      currentStep++;
      this.loadingProgress = Math.min((currentStep / totalSteps) * 100, 100);

      // Update loading message based on progress
      if (this.loadingProgress < 30) {
        this.loadingMessage = 'Initializing sensor...';
      } else if (this.loadingProgress < 60) {
        this.loadingMessage = 'Reading temperature data...';
      } else if (this.loadingProgress < 90) {
        this.loadingMessage = 'Processing humidity values...';
      } else {
        this.loadingMessage = 'Almost ready...';
      }

      // Stop at 100%
      if (this.loadingProgress >= 100) {
        clearInterval(this.progressInterval);
      }
    }, updateInterval);
  }

  /**
   * Complete loading and clear progress interval
   */
  completeLoading(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    this.loadingProgress = 100;

    // Small delay to show 100% before hiding
    setTimeout(() => {
      this.loading = false;
    }, 300);
  }

  loadLatest(): void {
    this.roomTempService.getLatest().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.latestReading = response.data as RoomTempReading;
          this.updateLastUpdated();
        }
        // Don't set loading to false here - let the progress complete
      },
      error: (err) => {
        this.error = 'Sensor offline or not enabled';
        this.completeLoading();
      }
    });
  }

  /**
   * Handle back button click - disable DHT22 sensor and navigate home
   */
  onBackClick(): void {
    this.isDisabling = true;

    this.roomTempService.disableSensor().subscribe({
      next: (response) => {
        console.log('DHT22 sensor disabled successfully:', response);
        this.isDisabling = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Failed to disable DHT22 sensor:', err);
        this.isDisabling = false;
        this.router.navigate(['/']);
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
    return Math.max(0, Math.min(100, ((temp - 16) / 14) * 100));
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

  get comfortScore(): number {
    const temp = this.temperature;
    const hum = this.humidity;

    // Perfect range: 18-26°C and 40-60%
    if (temp >= 18 && temp <= 26 && hum >= 40 && hum <= 60) {
      return 95;
    }
    // Good range: 16-28°C and 30-70%
    if (temp >= 16 && temp <= 28 && hum >= 30 && hum <= 70) {
      return 75;
    }
    // Needs adjustment
    return 45;
  }

  get airQualityStatus(): string {
    if (this.comfortScore >= 90) return 'Excellent';
    if (this.comfortScore >= 70) return 'Good';
    return 'Fair';
  }

  get recommendations(): Array<{icon: string, text: string}> {
    const recs: Array<{icon: string, text: string}> = [];
    const temp = this.temperature;
    const hum = this.humidity;

    if (temp < 18) {
      recs.push({ icon: '🔥', text: 'Increase heating for better comfort' });
    } else if (temp > 26) {
      recs.push({ icon: '❄️', text: 'Consider cooling the room' });
    }

    if (hum < 40) {
      recs.push({ icon: '💧', text: 'Air is dry, use a humidifier' });
    } else if (hum > 60) {
      recs.push({ icon: '🌬️', text: 'High humidity, improve ventilation' });
    }

    if (recs.length === 0) {
      recs.push({ icon: '✅', text: 'Environment is optimal!' });
    }

    return recs;
  }

  getHumidityColor(): string {
    const hum = this.humidity;
    if (hum >= 40 && hum <= 60) return 'linear-gradient(90deg, #2ecc71, #27ae60)';
    if (hum >= 30 && hum <= 70) return 'linear-gradient(90deg, #f39c12, #e67e22)';
    return 'linear-gradient(90deg, #e74c3c, #c0392b)';
  }

  getTempColor(): string {
    const temp = this.temperature;
    if (temp >= 18 && temp <= 26) return 'linear-gradient(90deg, #64c8ff, #1e90ff)';
    if (temp >= 16 && temp <= 28) return 'linear-gradient(90deg, #f39c12, #e67e22)';
    return 'linear-gradient(90deg, #e74c3c, #c0392b)';
  }
}
