import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-heart-rate',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './heart-rate.component.html',
  styleUrls: ['./heart-rate.component.scss']
})
export class HeartRateComponent implements OnInit, OnDestroy {
  heartRate: number = 72;
  systolic: number = 120;
  diastolic: number = 80;
  oxygenLevel: number = 98;
  restingHeartRate: number = 68;
  hrv: number = 42;
  maxToday: number = 88;
  minToday: number = 64;
  lastUpdate: Date = new Date();
  
  heartHistory = [
    { time: '14:00', value: 72 },
    { time: '14:10', value: 74 },
    { time: '14:20', value: 71 },
    { time: '14:30', value: 75 },
    { time: '14:40', value: 73 },
    { time: '14:50', value: 76 },
    { time: '15:00', value: 72 }
  ];

  private updateInterval: any;

  ngOnInit() {
    // Simulate real-time updates
    this.updateInterval = setInterval(() => {
      this.updateHeartRate();
    }, 3000);
  }

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  updateHeartRate() {
    // Simulate realistic heart rate changes
    const change = (Math.random() * 6) - 3;
    this.heartRate = Math.max(60, Math.min(100, Math.round(this.heartRate + change)));
    this.lastUpdate = new Date();
    
    // Update related values
    this.systolic = 120 + Math.floor(Math.random() * 10) - 5;
    this.diastolic = 80 + Math.floor(Math.random() * 8) - 4;
    this.oxygenLevel = 96 + Math.floor(Math.random() * 4);
    
    // Add to history
    this.addToHistory();
  }

  addToHistory() {
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                   now.getMinutes().toString().padStart(2, '0');
    
    this.heartHistory.push({ time: timeStr, value: this.heartRate });
    
    // Keep only last 7 points
    if (this.heartHistory.length > 7) {
      this.heartHistory.shift();
    }
  }

  getStatusClass(): string {
    if (this.heartRate < 60) return 'status-low';
    if (this.heartRate > 100) return 'status-high';
    return 'status-normal';
  }

  getStatusText(): string {
    if (this.heartRate < 60) return 'Low';
    if (this.heartRate > 100) return 'High';
    return 'Normal';
  }

  getGraphHeight(value: number): number {
    // Convert 60-100 BPM to 20-80% height
    return ((value - 60) / 40) * 60 + 20;
  }
}