import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-body-temp',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './body-temp.component.html',
  styleUrls: ['./body-temp.component.scss']
})
export class BodyTempComponent implements OnInit, OnDestroy {
  bodyTemp: number = 36.6;
  lastMeasurement: Date = new Date();
  todayHigh: number = 37.2;
  todayLow: number = 36.2;
  accuracy: number = 98;
  peakTime: string = '16:30';
  trend: number = 0.2;

  temperatureScale = [
    { value: 35, position: 0 },
    { value: 36, position: 25 },
    { value: 37, position: 50 },
    { value: 38, position: 75 },
    { value: 39, position: 100 }
  ];

  tempHistory = [
    { time: '06:00', temp: 36.2 },
    { time: '09:00', temp: 36.4 },
    { time: '12:00', temp: 36.7 },
    { time: '15:00', temp: 37.0 },
    { time: '18:00', temp: 37.1 },
    { time: '21:00', temp: 36.8 },
    { time: '00:00', temp: 36.5 }
  ];

  private updateInterval: any;

  ngOnInit() {
    this.updateInterval = setInterval(() => {
      this.updateTemperature();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  updateTemperature() {
    // Simulate realistic temperature changes
    const change = (Math.random() * 0.4) - 0.2; // -0.2 to +0.2
    this.bodyTemp = Math.max(35.5, Math.min(39.0, this.bodyTemp + change));
    this.bodyTemp = Math.round(this.bodyTemp * 10) / 10; // Keep 1 decimal
    
    this.lastMeasurement = new Date();
    
    // Update today's high/low
    if (this.bodyTemp > this.todayHigh) {
      this.todayHigh = this.bodyTemp;
    }
    if (this.bodyTemp < this.todayLow) {
      this.todayLow = this.bodyTemp;
    }
    
    // Add to history
    this.updateHistory();
  }

  updateHistory() {
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':00';
    
    // Update existing hour or add new
    const existing = this.tempHistory.find(item => item.time === timeStr);
    if (existing) {
      existing.temp = this.bodyTemp;
    } else {
      this.tempHistory.push({ time: timeStr, temp: this.bodyTemp });
      if (this.tempHistory.length > 7) {
        this.tempHistory.shift();
      }
    }
  }

  getMercuryHeight(): number {
    // Convert 35-39°C to 0-100% height
    return ((this.bodyTemp - 35) / 4) * 100;
  }

  getChartHeight(temp: number): number {
    // Convert 35-39°C to 0-100% height
    return ((temp - 35) / 4) * 80 + 10;
  }

  getBarClass(temp: number): string {
    if (temp >= 38) return 'fever';
    if (temp >= 37) return 'elevated';
    return 'normal';
  }

  getTempStatus(): string {
    if (this.bodyTemp >= 38) return 'FEVER';
    if (this.bodyTemp >= 37) return 'ELEVATED';
    return 'NORMAL';
  }

  getTempStatusClass(): string {
    if (this.bodyTemp >= 38) return 'status-fever';
    if (this.bodyTemp >= 37) return 'status-elevated';
    return 'status-normal';
  }
}