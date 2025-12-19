import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SensorControlService } from '../../core/services/sensor-control.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  currentTime: string = '';
  currentDate: string = '';
  weather: string = '22°C';
  showMainUI: boolean = false;
  private timeInterval: any;

  constructor(
    private sensorControl: SensorControlService,
    private router: Router
  ) {}

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    this.currentDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  startMirror() {
    this.showMainUI = true;
  }

  goBack() {
    this.showMainUI = false;
  }

  // Helper to enable sensor(s) and navigate
  private enableAndNavigate(sensorNames: string | string[], route: string) {
    const sensors = Array.isArray(sensorNames) ? sensorNames : [sensorNames];

    // Fire and forget – we don't block navigation on this
    sensors.forEach(sensor => {
      this.sensorControl.toggleSensor(sensor as any, true).subscribe({
        next: (res) => console.log(`✅ ${sensor} enabled`, res.message),
        error: (err) => console.warn(`⚠️ Failed to enable ${sensor}`, err.message)
      });
    });

    // Navigate immediately (smooth UX)
    this.router.navigate([route]);
  }

  // Button actions with sensor enabling
  openHeartRate() {
    this.enableAndNavigate('max30105', '/heart');
  }

  openBodyTemp() {
    this.enableAndNavigate('mlx90614', '/body-temp');
  }

  openRoomTemp() {
    this.enableAndNavigate('dht22', '/room-temp');
  }

  openGasDetection() {
    this.enableAndNavigate('mq135', '/gas');
  }

  openSkincare() {
    // Skincare needs both skin temp (mlx90614) and humidity (dht22)
    this.enableAndNavigate(['mlx90614', 'dht22'], '/face');
  }
}
