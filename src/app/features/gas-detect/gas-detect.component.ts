import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GasDetectionService, GasReading } from '../../core/services/gas-detection.service';
import { interval, Subscription, switchMap } from 'rxjs';

@Component({
  selector: 'app-gas-detect',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gas-detect.component.html',
  styleUrls: ['./gas-detect.component.scss']
})
export class GasDetectComponent implements OnInit, OnDestroy {
  latestReading: GasReading | null = null;
  loading = true;
  error: string | null = null;
  lastUpdated: string = '';

  private pollSubscription!: Subscription;

  constructor(private gasService: GasDetectionService) {}

  ngOnInit(): void {
    this.pollSubscription = interval(8000)
      .pipe(switchMap(() => this.gasService.getLatest()))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.latestReading = res.data as GasReading;
            this.updateLastUpdated();
            this.loading = false;
            this.error = null;
          } else {
            this.error = 'Waiting for sensor data...';
            this.loading = false;
          }
        },
        error: () => {
          this.error = 'MQ135 sensor not enabled';
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
    this.gasService.getLatest().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.latestReading = res.data as GasReading;
          this.updateLastUpdated();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Sensor offline';
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

  // === Getters for Real Data ===
  get rawValue(): number {
    return this.latestReading?.rawValue ?? 0;
  }

  get quality(): string {
    return this.latestReading?.quality ?? 'Unknown';
  }

  // === Enhanced Analysis from MQ135 Raw Value ===
  get co2Ppm(): number {
    // Approximate CO2 estimation based on typical MQ135 calibration
    // Normal clean air: ~400ppm → raw ~700-900
    // High CO2 (stuffy room): 1000-2000ppm → raw increases
    if (this.rawValue < 800) return 400;
    if (this.rawValue < 1500) return Math.round(400 + (this.rawValue - 800) * 1.2);
    if (this.rawValue < 2500) return Math.round(1000 + (this.rawValue - 1500) * 0.8);
    return Math.round(1500 + (this.rawValue - 2500) * 0.5);
  }

  get smokeLevel(): number {
    // Approximate smoke/particle estimation (higher raw = more reducing gases/smoke)
    if (this.rawValue < 1000) return 5;
    if (this.rawValue < 2000) return Math.round(10 + (this.rawValue - 1000) / 50);
    if (this.rawValue < 3000) return Math.round(30 + (this.rawValue - 2000) / 40);
    return Math.round(60 + (this.rawValue - 3000) / 30);
  }

  // === Status & Classes ===
  get qualityClass(): string {
    switch (this.quality) {
      case 'Excellent': return 'excellent';
      case 'Good': return 'good';
      case 'Moderate': return 'moderate';
      case 'Poor': return 'poor';
      case 'Hazardous': return 'danger';
      default: return 'unknown';
    }
  }

  get qualityIcon(): string {
    switch (this.quality) {
      case 'Excellent':
      case 'Good': return '✅';
      case 'Moderate': return '⚠️';
      case 'Poor':
      case 'Hazardous': return '🚨';
      default: return '❓';
    }
  }

  get co2Status(): string {
    if (this.co2Ppm <= 800) return 'Good';
    if (this.co2Ppm <= 1200) return 'Moderate';
    if (this.co2Ppm <= 2000) return 'Poor';
    return 'Dangerous';
  }

  get co2Class(): string {
    if (this.co2Ppm <= 800) return 'good';
    if (this.co2Ppm <= 1200) return 'moderate';
    if (this.co2Ppm <= 2000) return 'poor';
    return 'danger';
  }

  get smokeStatus(): string {
    if (this.smokeLevel <= 25) return 'Low';
    if (this.smokeLevel <= 50) return 'Moderate';
    if (this.smokeLevel <= 100) return 'High';
    return 'Hazardous';
  }

  get smokeClass(): string {
    if (this.smokeLevel <= 25) return 'good';
    if (this.smokeLevel <= 50) return 'moderate';
    if (this.smokeLevel <= 100) return 'poor';
    return 'danger';
  }

  get isDangerous(): boolean {
    return this.quality === 'Poor' || this.quality === 'Hazardous' || this.co2Ppm > 1500 || this.smokeLevel > 75;
  }

  get isWarning(): boolean {
    return this.quality === 'Moderate' || this.co2Ppm > 1000 || this.smokeLevel > 40;
  }

  // === Percentages for Meters ===
  get rawPercentage(): number {
    return Math.min(100, (this.rawValue / 4095) * 100);
  }

  get co2Percentage(): number {
    return Math.min(100, ((this.co2Ppm - 400) / 2000) * 100);
  }

  get smokePercentage(): number {
    return Math.min(100, (this.smokeLevel / 150) * 100);
  }

  get connectionStatus(): string {
    if (this.loading) return 'connecting';
    if (this.error) return 'offline';
    return 'online';
  }

  get connectionStatusText(): string {
    if (this.loading) return 'Connecting...';
    if (this.error) return 'Sensor Off';
    return 'Live Monitoring';
  }
}
