// sensor.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  // Mock data for now
  getHeartRate() {
    return Math.floor(Math.random() * 40) + 60; // 60-100 BPM
  }
  
  getBodyTemp() {
    return (Math.random() * 2) + 36; // 36-38°C
  }
  
  getRoomTemp() {
    return (Math.random() * 10) + 20; // 20-30°C
  }
  
  getGasLevel() {
    return Math.random() * 100; // 0-100%
  }
}