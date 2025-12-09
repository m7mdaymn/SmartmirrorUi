import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-room-temp',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './room-temp.component.html',
  styleUrls: ['./room-temp.component.scss']
})
export class RoomTempComponent implements OnInit, OnDestroy {
  // Temperature
  roomTemp: number = 22.5;
  tempMin: number = 20.1;
  tempMax: number = 24.3;
  tempAvg: number = 22.2;
  tempTrend: number = 0.3;
  
  // Humidity
  humidity: number = 45;
  dewPoint: number = 10.2;
  feelsLike: number = 22.8;
  humidityTrend: number = -2;
  
  // Air Quality
  aqi: number = 42;
  co2: number = 650;
  voc: number = 180;
  pm25: number = 12;
  
  // Comfort
  comfortIndex: number = 78;
  comfortFactors = [
    { name: 'Temperature', value: 82 },
    { name: 'Humidity', value: 75 },
    { name: 'Air Quality', value: 65 },
    { name: 'Ventilation', value: 90 }
  ];
  
  comfortTips = [
    'Ideal temperature range maintained',
    'Consider opening a window for fresh air',
    'Humidity level is optimal',
    'CO₂ levels are within safe limits'
  ];
  
  // Hourly data for chart
  hourlyData = [
    { hour: 0, temp: 21.5, humidity: 48 },
    { hour: 2, temp: 21.2, humidity: 49 },
    { hour: 4, temp: 20.8, humidity: 51 },
    { hour: 6, temp: 20.5, humidity: 53 },
    { hour: 8, temp: 21.0, humidity: 50 },
    { hour: 10, temp: 22.0, humidity: 48 },
    { hour: 12, temp: 23.2, humidity: 45 },
    { hour: 14, temp: 24.0, humidity: 43 },
    { hour: 16, temp: 23.8, humidity: 44 },
    { hour: 18, temp: 23.0, humidity: 46 },
    { hour: 20, temp: 22.2, humidity: 47 },
    { hour: 22, temp: 21.8, humidity: 48 }
  ];
  
  timeLabels = [
    { time: '00:00', position: 0 },
    { time: '06:00', position: 25 },
    { time: '12:00', position: 50 },
    { time: '18:00', position: 75 },
    { time: '24:00', position: 100 }
  ];

  private updateInterval: any;

  ngOnInit() {
    this.updateInterval = setInterval(() => {
      this.updateRoomData();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  updateRoomData() {
    // Simulate realistic room data changes
    const tempChange = (Math.random() * 0.6) - 0.3; // -0.3 to +0.3
    this.roomTemp = Math.max(18, Math.min(28, this.roomTemp + tempChange));
    this.roomTemp = Math.round(this.roomTemp * 10) / 10;
    
    const humidityChange = (Math.random() * 4) - 2; // -2 to +2
    this.humidity = Math.max(30, Math.min(70, this.humidity + humidityChange));
    
    // Update derived values
    this.dewPoint = this.calculateDewPoint(this.roomTemp, this.humidity);
    this.feelsLike = this.calculateFeelsLike(this.roomTemp, this.humidity);
    this.aqi = Math.max(0, Math.min(100, this.aqi + (Math.random() * 10) - 5));
    
    // Update comfort index
    this.updateComfortIndex();
    
    // Add to hourly data
    this.updateHourlyData();
  }

  calculateDewPoint(temp: number, humidity: number): number {
    // Simplified dew point calculation
    return Math.round((temp - (100 - humidity) / 5) * 10) / 10;
  }

  calculateFeelsLike(temp: number, humidity: number): number {
    // Simplified heat index/feels like
    if (temp < 20) return temp;
    const feels = temp + 0.05 * humidity;
    return Math.round(feels * 10) / 10;
  }

  updateComfortIndex() {
    // Calculate based on all factors
    const tempScore = Math.max(0, 100 - Math.abs(this.roomTemp - 22) * 10);
    const humidityScore = Math.max(0, 100 - Math.abs(this.humidity - 50) * 2);
    const airScore = Math.max(0, 100 - this.aqi);
    
    this.comfortIndex = Math.round((tempScore + humidityScore + airScore) / 3);
    
    // Update factors
    this.comfortFactors[0].value = tempScore;
    this.comfortFactors[1].value = humidityScore;
    this.comfortFactors[2].value = airScore;
  }

  updateHourlyData() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Add current data point
    const newData = {
      hour: currentHour,
      temp: this.roomTemp,
      humidity: this.humidity
    };
    
    // Update or add
    const existingIndex = this.hourlyData.findIndex(d => d.hour === currentHour);
    if (existingIndex >= 0) {
      this.hourlyData[existingIndex] = newData;
    } else {
      this.hourlyData.push(newData);
      // Sort by hour
      this.hourlyData.sort((a, b) => a.hour - b.hour);
      // Keep only 24 hours
      if (this.hourlyData.length > 12) {
        this.hourlyData.shift();
      }
    }
  }

  getTempPercentage(): number {
    // Convert 16-30°C to 0-100%
    return ((this.roomTemp - 16) / 14) * 100;
  }

  getCo2Percentage(): number {
    // Convert 400-2000 ppm to 0-100%
    return Math.min(100, ((this.co2 - 400) / 1600) * 100);
  }

  getVocPercentage(): number {
    // Convert 0-500 ppb to 0-100%
    return Math.min(100, (this.voc / 5));
  }

  getPm25Percentage(): number {
    // Convert 0-50 µg/m³ to 0-100%
    return Math.min(100, (this.pm25 / 0.5));
  }

  getRoomStatus(): string {
    if (this.comfortIndex >= 80) return 'optimal';
    if (this.comfortIndex >= 60) return 'good';
    return 'poor';
  }

  getRoomStatusText(): string {
    switch(this.getRoomStatus()) {
      case 'optimal': return 'Optimal';
      case 'good': return 'Comfortable';
      default: return 'Needs Attention';
    }
  }

  getAqiClass(): string {
    if (this.aqi <= 50) return 'good';
    if (this.aqi <= 100) return 'moderate';
    return 'poor';
  }

  getAqiText(): string {
    if (this.aqi <= 50) return 'Good';
    if (this.aqi <= 100) return 'Moderate';
    return 'Poor';
  }

  getAdviceIcon(): string {
    if (this.aqi <= 50) return '✅';
    if (this.aqi <= 100) return '⚠️';
    return '🚨';
  }

  getAirAdvice(): string {
    if (this.aqi <= 50) return 'Air quality is excellent';
    if (this.aqi <= 100) return 'Air quality is acceptable';
    return 'Consider improving ventilation';
  }

  getComfortGradient(): string {
    if (this.comfortIndex >= 80) return 'conic-gradient(#2ecc71 0%, #2ecc71 ' + this.comfortIndex + '%, rgba(255,255,255,0.1) ' + this.comfortIndex + '%)';
    if (this.comfortIndex >= 60) return 'conic-gradient(#ffc107 0%, #ffc107 ' + this.comfortIndex + '%, rgba(255,255,255,0.1) ' + this.comfortIndex + '%)';
    return 'conic-gradient(#ff4757 0%, #ff4757 ' + this.comfortIndex + '%, rgba(255,255,255,0.1) ' + this.comfortIndex + '%)';
  }

  getComfortLevel(): string {
    if (this.comfortIndex >= 80) return 'Very Comfortable';
    if (this.comfortIndex >= 60) return 'Comfortable';
    return 'Uncomfortable';
  }

  getFactorClass(value: number): string {
    if (value >= 80) return 'excellent';
    if (value >= 60) return 'good';
    return 'poor';
  }

  getTempLinePoints(): string {
    return this.hourlyData.map((data, i) => {
      const x = (i / (this.hourlyData.length - 1)) * 100;
      const y = 100 - ((data.temp - 15) / 15) * 100;
      return `${x},${y}`;
    }).join(' ');
  }

  getHumidityLinePoints(): string {
    return this.hourlyData.map((data, i) => {
      const x = (i / (this.hourlyData.length - 1)) * 100;
      const y = 100 - (data.humidity / 100) * 100;
      return `${x},${y}`;
    }).join(' ');
  }
}