import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';

// Static mock data interface
interface HumanTempReading {
  objectTemp: number;
  ambientTemp: number;
  unit: string;
  timestamp: string;
}

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
  isDisabling = false;

  private pollSubscription!: Subscription;

  // Array of temperature values to cycle through
  private temperatureValues = [37.1, 37.3, 37.0];
  private currentTempIndex = 0;

  // Static mock data - you can modify these values
  private staticData: HumanTempReading = {
    objectTemp: 37.1,      // Body temperature in Celsius
    ambientTemp: 24.5,     // Ambient temperature in Celsius
    unit: 'C',             // Temperature unit
    timestamp: new Date().toISOString()
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Simulate initial loading
    setTimeout(() => {
      this.loadStaticData();
      this.loading = false;
    }, 1000);

    // Simulate periodic updates (optional - simulates small temperature fluctuations)
    this.pollSubscription = interval(8000).subscribe(() => {
      this.simulateTemperatureUpdate();
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  /**
   * Load static data
   */
  loadStaticData(): void {
    this.latestReading = { ...this.staticData };
    this.updateLastUpdated();
    this.error = null;
  }

  /**
   * Cycle through the temperature values
   */
  simulateTemperatureUpdate(): void {
    if (this.latestReading) {
      // Move to next temperature in the cycle
      this.currentTempIndex = (this.currentTempIndex + 1) % this.temperatureValues.length;

      // Update to the next temperature value
      this.latestReading.objectTemp = this.temperatureValues[this.currentTempIndex];
      this.latestReading.timestamp = new Date().toISOString();
      this.updateLastUpdated();
    }
  }

  /**
   * Handle back button click - navigate home
   */
  onBackClick(): void {
    this.isDisabling = true;

    // Simulate disable delay
    setTimeout(() => {
      console.log('Navigating back to home');
      this.isDisabling = false;
      this.router.navigate(['/']);
    }, 500);
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
