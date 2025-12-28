import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

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
  loading = false;
  measuring = false;
  error: string | null = null;
  lastUpdated: string = '';
  isDisabling = false;

  // Loading progress properties
  loadingProgress = 0;
  loadingMessage = 'Put your finger for 7 seconds...';
  
  private progressInterval?: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Start measurement automatically when page opens
    this.startMeasurement();
  }

  ngOnDestroy(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  // Show instruction text before progress
  showInstructionText = false;

  /**
   * Start temperature measurement
   */
  startMeasurement(): void {
    if (this.measuring) return;

    this.measuring = true;
    this.loading = true;
    this.error = null;
    this.latestReading = null;
    
    // First: Show instruction text for 3 seconds
    this.showInstructionText = true;
    this.loadingMessage = 'Place your finger on the sensor...';
    
    setTimeout(() => {
      // After 3 seconds: Hide text and start progress
      this.showInstructionText = false;
      this.startLoadingProgress();
    }, 3000);
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
      if (this.loadingProgress < 20) {
        this.loadingMessage = 'Detecting temperature...';
      } else if (this.loadingProgress < 40) {
        this.loadingMessage = 'Reading sensor data...';
      } else if (this.loadingProgress < 60) {
        this.loadingMessage = 'Calibrating reading...';
      } else if (this.loadingProgress < 80) {
        this.loadingMessage = 'Analyzing data...';
      } else if (this.loadingProgress < 95) {
        this.loadingMessage = 'Finalizing measurement...';
      } else {
        this.loadingMessage = 'Almost done...';
      }

      // Complete at 100%
      if (this.loadingProgress >= 100) {
        clearInterval(this.progressInterval);
        this.completeMeasurement();
      }
    }, updateInterval);
  }

  /**
   * Complete measurement and generate random temperature between 37.1 and 37.9
   */
  completeMeasurement(): void {
    // Generate random temperature between 37.1 and 37.9 with one decimal
    const minTemp = 37.1;
    const maxTemp = 37.9;
    const randomTemp = Math.random() * (maxTemp - minTemp) + minTemp;
    const bodyTemperature = Math.round(randomTemp * 10) / 10; // Round to 1 decimal

    // Generate ambient temperature (typically cooler)
    const ambientTemp = Math.round((22 + Math.random() * 4) * 10) / 10; // 22-26°C

    this.latestReading = {
      objectTemp: bodyTemperature,
      ambientTemp: ambientTemp,
      unit: 'C',
      timestamp: new Date().toISOString()
    };

    this.updateLastUpdated();

    // Small delay to show 100% before hiding loading
    setTimeout(() => {
      this.loading = false;
      this.measuring = false;
    }, 300);
  }

  /**
   * Handle back button click
   */
  onBackClick(): void {
    this.isDisabling = true;

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

  // === Data Getters ===
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
    if (!this.latestReading) return 'READY';
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
      case 'LOW': return 'status-low';
      default: return 'status-ready';
    }
  }

  get tempIcon(): string {
    switch (this.tempStatus) {
      case 'FEVER': return '🤒';
      case 'ELEVATED': return '😓';
      case 'NORMAL': return '😊';
      case 'LOW': return '🥶';
      default: return '🌡️';
    }
  }

  get connectionStatus(): string {
    if (this.measuring) return 'measuring';
    if (this.error) return 'offline';
    if (this.latestReading) return 'online';
    return 'ready';
  }

  get connectionStatusText(): string {
    if (this.measuring) return 'Measuring...';
    if (this.error) return 'Sensor Off';
    if (this.latestReading) return 'Measurement Complete';
    return 'Ready';
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