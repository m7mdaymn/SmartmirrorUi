import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-gas-detect',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gas-detect.component.html',
  styleUrls: ['./gas-detect.component.scss']
})
export class GasDetectComponent implements OnInit, OnDestroy {
  // Emergency State
  emergencyActive: boolean = false;
  alarmActive: boolean = false;
  
  // Gas Levels
  co2Level: number = 450;
  methaneLevel: number = 2.5;
  smokeLevel: number = 15;
  lastUpdate: Date = new Date();
  
  // System Status
  ventilationActive: boolean = false;
  ventilationStatus: string = 'Closed';
  
  // History Data
  selectedPeriod: string = '1h';
  gasHistory: any[] = [];
  
  // Chart Data
  gridLines = [
    { value: '0', position: 100 },
    { value: '500', position: 66 },
    { value: '1000', position: 33 },
    { value: '1500', position: 0 }
  ];
  
  timeLabels = [
    { time: '00:00', position: 0 },
    { time: '06:00', position: 25 },
    { time: '12:00', position: 50 },
    { time: '18:00', position: 75 },
    { time: '24:00', position: 100 }
  ];

  private updateInterval: any;
  private alarmSound: HTMLAudioElement;

  constructor() {
    this.alarmSound = new Audio();
    this.alarmSound.src = 'assets/alarm.mp3'; // You'll need to add this file
    this.alarmSound.loop = true;
  }

  ngOnInit() {
    this.generateHistoryData();
    this.updateInterval = setInterval(() => {
      this.updateGasLevels();
    }, 3000);
  }

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.alarmActive) {
      this.alarmSound.pause();
    }
  }

  updateGasLevels() {
    // Simulate realistic gas level changes
    const co2Change = (Math.random() * 30) - 15; // -15 to +15
    this.co2Level = Math.max(400, Math.min(2000, this.co2Level + co2Change));
    
    const methaneChange = (Math.random() * 0.5) - 0.25; // -0.25 to +0.25
    this.methaneLevel = Math.max(0, Math.min(20, this.methaneLevel + methaneChange));
    this.methaneLevel = Math.round(this.methaneLevel * 10) / 10;
    
    const smokeChange = (Math.random() * 5) - 2.5; // -2.5 to +2.5
    this.smokeLevel = Math.max(0, Math.min(100, this.smokeLevel + smokeChange));
    this.smokeLevel = Math.round(this.smokeLevel);
    
    this.lastUpdate = new Date();
    
    // Check for emergency conditions
    this.checkEmergencyConditions();
    
    // Update history
    this.addToHistory();
  }

  checkEmergencyConditions() {
    // Check if any gas levels are dangerous
    const co2Danger = this.co2Level > 1000;
    const methaneDanger = this.methaneLevel > 10;
    const smokeDanger = this.smokeLevel > 50;
    
    if (co2Danger || methaneDanger || smokeDanger) {
      this.triggerEmergency();
    } else {
      this.emergencyActive = false;
    }
    
    // Auto-activate ventilation if CO2 is high
    if (this.co2Level > 800 && !this.ventilationActive) {
      this.ventilationActive = true;
      this.ventilationStatus = 'Auto-Opened';
    }
    
    // Auto-close ventilation if levels are safe
    if (this.co2Level < 500 && this.methaneLevel < 2 && this.smokeLevel < 10 && this.ventilationActive) {
      this.ventilationActive = false;
      this.ventilationStatus = 'Auto-Closed';
    }
  }

  triggerEmergency() {
    this.emergencyActive = true;
    if (!this.alarmActive) {
      this.toggleAlarm(); // Auto-activate alarm
    }
  }

  dismissEmergency() {
    this.emergencyActive = false;
    if (this.alarmActive) {
      this.toggleAlarm(); // Turn off alarm
    }
  }

  toggleAlarm() {
    this.alarmActive = !this.alarmActive;
    
    if (this.alarmActive) {
      // In a real app, play alarm sound
      // this.alarmSound.play().catch(e => console.log('Audio error:', e));
      console.log('ALARM ACTIVATED!');
    } else {
      // this.alarmSound.pause();
      // this.alarmSound.currentTime = 0;
      console.log('Alarm deactivated');
    }
  }

  toggleVentilation() {
    this.ventilationActive = !this.ventilationActive;
    this.ventilationStatus = this.ventilationActive ? 'Open' : 'Closed';
  }

  sendEmergencyAlert() {
    // In real app, send SMS/Email/Notification
    console.log('Emergency alert sent to contacts!');
    alert('Emergency alert has been sent to registered contacts!');
  }

  resetSystem() {
    this.co2Level = 400;
    this.methaneLevel = 0;
    this.smokeLevel = 0;
    this.emergencyActive = false;
    this.alarmActive = false;
    this.ventilationActive = false;
    this.ventilationStatus = 'Closed';
    
    console.log('System reset to safe levels');
    alert('Gas detection system has been reset');
  }

  generateHistoryData() {
    this.gasHistory = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      this.gasHistory.push({
        time: time.getHours().toString().padStart(2, '0') + ':00',
        co2: 400 + Math.random() * 600,
        methane: Math.random() * 5,
        smoke: Math.random() * 30
      });
    }
  }

  addToHistory() {
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':00';
    
    // Update existing hour or add new
    const existing = this.gasHistory.find(item => item.time === timeStr);
    if (existing) {
      existing.co2 = this.co2Level;
      existing.methane = this.methaneLevel;
      existing.smoke = this.smokeLevel;
    } else {
      this.gasHistory.push({
        time: timeStr,
        co2: this.co2Level,
        methane: this.methaneLevel,
        smoke: this.smokeLevel
      });
      
      // Keep only 24 hours
      if (this.gasHistory.length > 24) {
        this.gasHistory.shift();
      }
    }
  }

  selectPeriod(period: string) {
    this.selectedPeriod = period;
    this.generateHistoryData(); // Regenerate for selected period
  }

  getSystemStatus(): string {
    if (this.emergencyActive) return 'emergency';
    if (this.co2Level > 800 || this.methaneLevel > 5 || this.smokeLevel > 25) return 'warning';
    return 'safe';
  }

  getSystemStatusText(): string {
    switch(this.getSystemStatus()) {
      case 'emergency': return 'EMERGENCY';
      case 'warning': return 'WARNING';
      default: return 'ALL SAFE';
    }
  }

  getGasCardClass(gasType: string): string {
    switch(gasType) {
      case 'co2':
        if (this.co2Level > 1000) return 'danger';
        if (this.co2Level > 800) return 'warning';
        return 'safe';
      case 'methane':
        if (this.methaneLevel > 10) return 'danger';
        if (this.methaneLevel > 5) return 'warning';
        return 'safe';
      case 'smoke':
        if (this.smokeLevel > 50) return 'danger';
        if (this.smokeLevel > 25) return 'warning';
        return 'safe';
      default: return 'safe';
    }
  }

  getGasStatus(gasType: string): string {
    return this.getGasCardClass(gasType);
  }

  getGasStatusText(gasType: string): string {
    switch(this.getGasCardClass(gasType)) {
      case 'danger': return 'DANGER';
      case 'warning': return 'WARNING';
      default: return 'SAFE';
    }
  }

  getCo2Percentage(): number {
    // Convert 400-2000 ppm to 0-100%
    return Math.min(100, ((this.co2Level - 400) / 1600) * 100);
  }

  getMethanePercentage(): number {
    // Convert 0-20% LEL to 0-100%
    return Math.min(100, (this.methaneLevel / 20) * 100);
  }

  getSmokePercentage(): number {
    // Convert 0-100 µg/m³ to 0-100%
    return Math.min(100, this.smokeLevel);
  }

  getCo2LinePoints(): string {
    return this.gasHistory.map((data, i) => {
      const x = (i / (this.gasHistory.length - 1)) * 100;
      const y = 100 - ((data.co2 - 400) / 1600) * 100;
      return `${x},${y}`;
    }).join(' ');
  }

  getMethaneLinePoints(): string {
    return this.gasHistory.map((data, i) => {
      const x = (i / (this.gasHistory.length - 1)) * 100;
      const y = 100 - (data.methane / 20) * 100;
      return `${x},${y}`;
    }).join(' ');
  }

  getSmokeLinePoints(): string {
    return this.gasHistory.map((data, i) => {
      const x = (i / (this.gasHistory.length - 1)) * 100;
      const y = 100 - (data.smoke / 100) * 100;
      return `${x},${y}`;
    }).join(' ');
  }
}