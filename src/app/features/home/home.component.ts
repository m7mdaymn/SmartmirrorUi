import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule], // Add RouterModule here
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  currentTime: string = '';
  currentDate: string = '';
  weather: string = '22°C';
  showMainUI: boolean = false;
  private timeInterval: any;

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
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

  // Keep these functions if you want to do something before navigating
  openHeartRate() {
    console.log('Opening Heart Rate & Blood Pressure Monitor');
    // You can add logic here before navigation
  }

  openTemperature() {
    console.log('Opening Body Temperature Monitor');
  }

  openRoomEnvironment() {
    console.log('Opening Room Temperature Monitor');
  }

  openGasDetection() {
    console.log('Opening Gas Detection System');
  }

  openSkincare() {
    console.log('Opening AI Skincare Analysis');
  }
}