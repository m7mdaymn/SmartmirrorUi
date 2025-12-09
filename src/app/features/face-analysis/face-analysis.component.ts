import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-face-analysis',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './face-analysis.component.html',
  styleUrls: ['./face-analysis.component.scss']
})
export class FaceAnalysisComponent implements OnInit {
  isScanning: boolean = false;
  faceDetected: boolean = false;
  capturedImage: string | null = null;
  analysisStatus: string = 'idle';
  
  // Face Analysis Data
  gender: string = 'Detecting...';
  estimatedAge: number = 0;
  skinTone: string = 'Detecting...';
  confidence: number = 0;
  
  // Skin Conditions
  skinConditions = [
    { name: 'Acne', level: 25, severity: 'low' },
    { name: 'Dark Circles', level: 60, severity: 'medium' },
    { name: 'Wrinkles', level: 15, severity: 'low' },
    { name: 'Pigmentation', level: 40, severity: 'medium' },
    { name: 'Redness', level: 30, severity: 'low' },
    { name: 'Oiliness', level: 55, severity: 'medium' }
  ];
  
  // Health Scores
  skinHealthScore: number = 0;
  hydrationScore: number = 0;
  evennessScore: number = 0;
  textureScore: number = 0;
  
  // Face Landmarks (for visualization)
  faceLandmarks = [
    { x: 40, y: 30 }, // Left eye
    { x: 60, y: 30 }, // Right eye
    { x: 50, y: 40 }, // Nose
    { x: 40, y: 50 }, // Left mouth corner
    { x: 60, y: 50 }  // Right mouth corner
  ];
  
  // Recommendations
  recommendations = [
    { 
      icon: '💧', 
      title: 'Hydrating Serum', 
      description: 'Use hyaluronic acid serum twice daily',
      priority: 'high' 
    },
    { 
      icon: '☀️', 
      title: 'Sunscreen', 
      description: 'Apply SPF 50+ every morning',
      priority: 'high' 
    },
    { 
      icon: '🌙', 
      title: 'Night Cream', 
      description: 'Retinol cream before bedtime',
      priority: 'medium' 
    },
    { 
      icon: '🧴', 
      title: 'Moisturizer', 
      description: 'Oil-free moisturizer for combination skin',
      priority: 'medium' 
    }
  ];
  
  // Daily Routine
  dailyRoutine = [
    { time: '07:00', icon: '🌅', title: 'Morning Cleanse', description: 'Gentle cleanser with warm water' },
    { time: '07:15', icon: '💧', title: 'Hydration', description: 'Apply vitamin C serum' },
    { time: '07:30', icon: '☀️', title: 'Sun Protection', description: 'SPF 50+ sunscreen application' },
    { time: '20:00', icon: '🧼', title: 'Evening Cleanse', description: 'Double cleanse to remove impurities' },
    { time: '20:15', icon: '🌙', title: 'Night Treatment', description: 'Apply retinol treatment' },
    { time: '20:30', icon: '🌿', title: 'Moisturize', description: 'Night cream for recovery' }
  ];

  ngOnInit() {
    // Simulate initial detection
    setTimeout(() => {
      this.faceDetected = true;
    }, 1000);
  }

  startScan() {
    if (this.isScanning) return;
    
    this.isScanning = true;
    this.analysisStatus = 'scanning';
    
    // Simulate scanning process
    setTimeout(() => {
      this.performAnalysis();
    }, 2000);
  }

  performAnalysis() {
    // Generate random analysis data
    this.gender = Math.random() > 0.5 ? 'Male' : 'Female';
    this.estimatedAge = Math.floor(Math.random() * 30) + 20;
    this.skinTone = ['Fair', 'Light', 'Medium', 'Tan', 'Deep'][Math.floor(Math.random() * 5)];
    this.confidence = Math.floor(Math.random() * 30) + 70;
    
    // Update skin conditions with random values
    this.skinConditions.forEach(condition => {
      condition.level = Math.floor(Math.random() * 70);
      if (condition.level > 50) condition.severity = 'high';
      else if (condition.level > 25) condition.severity = 'medium';
      else condition.severity = 'low';
    });
    
    // Calculate health scores
    this.skinHealthScore = 100 - Math.floor(this.skinConditions.reduce((sum, c) => sum + c.level, 0) / 6);
    this.hydrationScore = Math.floor(Math.random() * 40) + 60;
    this.evennessScore = Math.floor(Math.random() * 50) + 50;
    this.textureScore = Math.floor(Math.random() * 60) + 40;
    
    this.isScanning = false;
    this.analysisStatus = 'complete';
    
    // Generate a mock image
    this.capturedImage = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#4a5568"/>
        <circle cx="200" cy="150" r="80" fill="#e2e8f0"/>
        <circle cx="160" cy="130" r="15" fill="#2d3748"/>
        <circle cx="240" cy="130" r="15" fill="#2d3748"/>
        <path d="M160 200 Q200 220 240 200" stroke="#2d3748" stroke-width="8" fill="none"/>
      </svg>
    `);
  }

  captureFace() {
    this.faceDetected = true;
    // In real app, this would capture from camera
  }

  resetScan() {
    this.isScanning = false;
    this.faceDetected = false;
    this.capturedImage = null;
    this.analysisStatus = 'idle';
    
    // Reset all values
    this.gender = 'Detecting...';
    this.estimatedAge = 0;
    this.skinTone = 'Detecting...';
    this.confidence = 0;
    this.skinHealthScore = 0;
  }

  getStatusText(): string {
    switch(this.analysisStatus) {
      case 'idle': return 'Ready';
      case 'scanning': return 'Analyzing...';
      case 'complete': return 'Analysis Complete';
      default: return 'Ready';
    }
  }

  getSeverityText(level: number): string {
    if (level > 50) return 'High';
    if (level > 25) return 'Medium';
    return 'Low';
  }
}