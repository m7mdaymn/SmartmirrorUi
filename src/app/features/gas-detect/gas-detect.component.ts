import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  isDisabling = false;

  // Loading progress properties
  loadingProgress = 0;
  loadingMessage = 'Initializing sensor...';

  private pollSubscription!: Subscription;
  private progressInterval?: any;

  constructor(
    private gasService: GasDetectionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Start loading progress animation
    this.startLoadingProgress();

    this.pollSubscription = interval(3000)
      .pipe(switchMap(() => this.gasService.getLatest()))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.latestReading = res.data as GasReading;
            this.updateLastUpdated();
            this.completeLoading();
            this.error = null;
          } else {
            this.error = 'Waiting for sensor data...';
            this.completeLoading();
          }
        },
        error: () => {
          this.error = 'MQ135 sensor not enabled';
          this.completeLoading();
        }
      });

    this.loadLatest();
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
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
        this.loadingMessage = 'Initializing MQ135 sensor...';
      } else if (this.loadingProgress < 60) {
        this.loadingMessage = 'Calibrating gas detection...';
      } else if (this.loadingProgress < 90) {
        this.loadingMessage = 'Analyzing air quality...';
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
    this.gasService.getLatest().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.latestReading = res.data as GasReading;
          this.updateLastUpdated();
        }
        // Don't set loading to false here - let the progress complete
      },
      error: () => {
        this.error = 'Sensor offline';
        this.completeLoading();
      }
    });
  }

  onBackClick(): void {
    this.isDisabling = true;

    this.gasService.disableSensor().subscribe({
      next: (response) => {
        console.log('MQ135 sensor disabled successfully:', response);
        this.isDisabling = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Failed to disable MQ135 sensor:', err);
        this.isDisabling = false;
        this.router.navigate(['/']);
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

  // === Direct values from ESP32 ===
  get rawValue(): number {
    return this.latestReading?.rawValue ?? 0;
  }

  get co2Ppm(): number {
    return this.latestReading?.co2_ppm ?? 0;
  }

  get co2Status(): string {
    return this.latestReading?.co2_status ?? 'Unknown';
  }

  get smokeLevel(): number {
    return this.latestReading?.smoke_level ?? 0;
  }

  get smokeStatus(): string {
    return this.latestReading?.smoke_status ?? 'Unknown';
  }

  get aqiScore(): number {
    return this.latestReading?.aqi_score ?? 0;
  }

  get quality(): string {
    return this.latestReading?.overall_quality ?? 'Unknown';
  }

  // === Status & Classes ===
  get qualityClass(): string {
    switch (this.quality) {
      case 'Excellent': return 'excellent';
      case 'Good': return 'good';
      case 'Moderate': return 'moderate';
      case 'Poor': return 'poor';
      case 'Very Poor':
      case 'Hazardous': return 'danger';
      default: return 'unknown';
    }
  }

  get qualityIcon(): string {
    if (this.aqiScore <= 50) return '✅';
    if (this.aqiScore <= 100) return '🟢';
    if (this.aqiScore <= 150) return '⚠️';
    if (this.aqiScore <= 200) return '🔴';
    return '🚨';
  }

  get co2Class(): string {
    switch (this.co2Status) {
      case 'Fresh Air':
      case 'Normal': return 'good';
      case 'Acceptable': return 'moderate';
      case 'Poor - Ventilate': return 'poor';
      case 'Dangerous': return 'danger';
      default: return 'unknown';
    }
  }

  get smokeClass(): string {
    switch (this.smokeStatus) {
      case 'Clean': return 'good';
      case 'Light': return 'good';
      case 'Moderate': return 'moderate';
      case 'Heavy': return 'poor';
      case 'Severe': return 'danger';
      default: return 'unknown';
    }
  }

  get isDangerous(): boolean {
    return this.aqiScore > 200 || this.quality === 'Hazardous' || this.quality === 'Very Poor';
  }

  get isWarning(): boolean {
    return this.aqiScore > 100 && this.aqiScore <= 200;
  }

  // === Percentages for Meters ===
  get rawPercentage(): number {
    return Math.min(100, (this.rawValue / 4095) * 100);
  }

  get co2Percentage(): number {
    // 400ppm (fresh) = 0%, 5000ppm (dangerous) = 100%
    return Math.min(100, Math.max(0, ((this.co2Ppm - 400) / 4600) * 100));
  }

  get smokePercentage(): number {
    return Math.min(100, this.smokeLevel);
  }

  get connectionStatus(): string {
    if (this.loading) return 'connecting';
    if (this.error) return 'offline';
    return this.isDangerous ? 'emergency' : this.isWarning ? 'warning' : 'safe';
  }

  get connectionStatusText(): string {
    if (this.loading) return 'Connecting...';
    if (this.error) return 'Sensor Off';
    return 'Live Monitoring';
  }

  // === New getters for analysis section ===
  get airQualityScore(): number {
    // Convert quality to score (0-100)
    if (this.aqiScore <= 50) return 95;
    if (this.aqiScore <= 100) return 75;
    if (this.aqiScore <= 150) return 50;
    if (this.aqiScore <= 200) return 30;
    return 15;
  }

  get environmentStatus(): string {
    if (this.airQualityScore >= 90) return 'Excellent';
    if (this.airQualityScore >= 70) return 'Good';
    if (this.airQualityScore >= 50) return 'Fair';
    return 'Poor';
  }

  get recommendations(): Array<{icon: string, text: string}> {
    const recs: Array<{icon: string, text: string}> = [];

    if (this.co2Ppm > 1000) {
      recs.push({ icon: '🌬️', text: 'High CO₂ detected - open windows for ventilation' });
    }

    if (this.smokeLevel > 50) {
      recs.push({ icon: '🔥', text: 'Elevated smoke particles - check for sources' });
    }

    if (this.quality === 'Poor' || this.quality === 'Hazardous') {
      recs.push({ icon: '⚠️', text: 'Poor air quality - limit exposure time' });
    }

    if (this.quality === 'Excellent' || this.quality === 'Good') {
      recs.push({ icon: '✅', text: 'Air quality is optimal!' });
    }

    if (recs.length === 0) {
      recs.push({ icon: '👍', text: 'Monitoring air quality continuously' });
    }

    return recs;
  }

  getCO2Color(): string {
    if (this.co2Ppm <= 1000) return 'linear-gradient(90deg, #2ecc71, #27ae60)';
    if (this.co2Ppm <= 2000) return 'linear-gradient(90deg, #f39c12, #e67e22)';
    return 'linear-gradient(90deg, #e74c3c, #c0392b)';
  }

  getSmokeColor(): string {
    if (this.smokeLevel <= 30) return 'linear-gradient(90deg, #2ecc71, #27ae60)';
    if (this.smokeLevel <= 60) return 'linear-gradient(90deg, #f39c12, #e67e22)';
    return 'linear-gradient(90deg, #e74c3c, #c0392b)';
  }

  get qualityColor(): string {
    switch (this.qualityClass) {
      case 'excellent':
      case 'good': return '#2ecc71';
      case 'moderate': return '#f39c12';
      case 'poor':
      case 'danger': return '#e74c3c';
      default: return '#95a5a6';
    }
  }
}
