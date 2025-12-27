import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SkincareService } from '../../core/services/skincare.service';

interface SkincareAnalysisResponse {
  success: boolean;
  message?: string;
  disclaimer?: string;
  data?: {
    skinType: string;
    condition: string;
    morningRoutine: string[];
    nightRoutine: string[];
    recommendedIngredients: string[];
    avoidIngredients: string[];
    lifestyleTips: string[];
  };
  aiAnalysis?: {
    detected: boolean;
    confidence: number;
    regions_analyzed: number;
    capturedImage?: string;
    skin_type_distribution?: any;
    condition_distribution?: any;
    message: string;
  };
  warning?: string;
}

@Component({
  selector: 'app-face-analysis',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './face-analysis.component.html',
  styleUrls: ['./face-analysis.component.scss']
})
export class FaceAnalysisComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  isScanning: boolean = false;
  faceDetected: boolean = false;
  capturedImage: string | null = null;
  analysisStatus: string = 'idle'; // 'idle' | 'preparing' | 'scanning' | 'complete' | 'error'
  errorMessage: string = '';
  analysisProgress: number = 0;

  // Video stream
  videoStream: MediaStream | null = null;
  showLiveVideo: boolean = false;

  // Real data from backend
  skinType: string = '';
  condition: string = '';
  morningRoutine: string[] = [];
  nightRoutine: string[] = [];
  recommendedIngredients: string[] = [];
  avoidIngredients: string[] = [];
  lifestyleTips: string[] = [];

  // AI confidence
  confidence: number = 0;
  regionsAnalyzed: number = 0;

  // Recommendations
  recommendations: any[] = [];
  dailyRoutine: any[] = [];

  private progressInterval: any;

  constructor(private skincareService: SkincareService) {}

  ngOnInit() {
    this.checkServiceStatus();
  }

  ngOnDestroy() {
    this.stopVideoStream();
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  checkServiceStatus() {
    this.skincareService.checkStatus().subscribe({
      next: (res) => {
        console.log('✅ Skincare API Status:', res);
      },
      error: (err) => {
        console.warn('⚠️ Skincare API not responding:', err.message);
        this.errorMessage = 'Backend service not available. Please start the Node.js server on port 5000.';
      }
    });
  }

  async startVideoStream() {
    try {
      this.showLiveVideo = true;
      this.analysisStatus = 'preparing';

      // Request camera access
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      // Wait for video element to be available
      setTimeout(() => {
        if (this.videoElement && this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.videoStream;
          this.videoElement.nativeElement.play();
          console.log('📹 Live video stream started');
        }
      }, 100);

    } catch (error) {
      console.error('❌ Camera access error:', error);
      this.errorMessage = 'Cannot access camera. Please allow camera permissions.';
      this.analysisStatus = 'error';
      this.showLiveVideo = false;
    }
  }

  stopVideoStream() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    this.showLiveVideo = false;
  }

  startScan() {
    if (this.isScanning) return;

    this.resetData();
    this.isScanning = true;
    this.analysisStatus = 'scanning';
    this.errorMessage = '';
    this.faceDetected = true;
    this.analysisProgress = 0;

    console.log('📸 Starting AI skin analysis...');

    // Start live video preview
    this.startVideoStream();

    // Simulate progress animation
    this.progressInterval = setInterval(() => {
      if (this.analysisProgress < 90) {
        this.analysisProgress += Math.random() * 15;
      }
    }, 300);

    // Call backend API after camera is ready
    setTimeout(() => {
      this.skincareService.analyzeSkin().subscribe({
        next: (response: any) => {
          this.analysisProgress = 100;
          console.log('✅ Analysis Complete:', response);

          if (response.success) {
            this.processAnalysisResults(response);
          } else {
            this.handleAnalysisError(response.message || 'Analysis failed');
          }

          // Stop video after capture
          setTimeout(() => this.stopVideoStream(), 500);
        },
        error: (error) => {
          console.error('❌ Analysis Error:', error);
          this.handleAnalysisError(error.message || 'Analysis failed');
          this.stopVideoStream();
        }
      });
    }, 1500); // Give time for video to load
  }

  processAnalysisResults(response: SkincareAnalysisResponse) {
    const data = response.data;
    const aiAnalysis = response.aiAnalysis;

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    console.log('📊 Processing backend data:', {
      skinType: data?.skinType,
      condition: data?.condition,
      aiConfidence: aiAnalysis?.confidence || 0,
      regionsAnalyzed: aiAnalysis?.regions_analyzed || 0,
      morningRoutine: data?.morningRoutine?.length || 0,
      nightRoutine: data?.nightRoutine?.length || 0,
      ingredients: data?.recommendedIngredients?.length || 0
    });

    // Store real data from backend
    this.skinType = data?.skinType || '';
    this.condition = data?.condition || '';
    this.morningRoutine = data?.morningRoutine || [];
    this.nightRoutine = data?.nightRoutine || [];
    this.recommendedIngredients = data?.recommendedIngredients || [];
    this.avoidIngredients = data?.avoidIngredients || [];
    this.lifestyleTips = data?.lifestyleTips || [];

    // Get AI confidence
    this.confidence = aiAnalysis?.confidence || 0;
    this.regionsAnalyzed = aiAnalysis?.regions_analyzed || 0;

    // Use captured image from AI if available
    if (aiAnalysis?.capturedImage) {
      this.capturedImage = aiAnalysis.capturedImage;
    }

    // Build recommendations and routine
    this.buildRecommendations();
    this.buildDailyRoutine();

    // Update UI state
    this.isScanning = false;
    this.analysisStatus = 'complete';

    console.log('✨ Analysis processed successfully');
    console.log('📋 Final data:', {
      recommendations: this.recommendations.length,
      routineSteps: this.dailyRoutine.length,
      avoidIngredients: this.avoidIngredients.length,
      lifestyleTips: this.lifestyleTips.length,
      aiConfidence: this.confidence + '%',
      regionsAnalyzed: this.regionsAnalyzed
    });

    // Show AI analysis details if available
    if (aiAnalysis) {
      console.log('🤖 AI Analysis:', {
        message: aiAnalysis.message,
        skinDistribution: aiAnalysis.skin_type_distribution,
        conditionDistribution: aiAnalysis.condition_distribution
      });
    }

    // Show warning if no recommendations found
    if (response.warning) {
      console.warn('⚠️', response.warning);
    }
  }

  buildRecommendations() {
    this.recommendations = [];

    if (this.morningRoutine.length > 0) {
      this.recommendations.push({
        icon: '🌅',
        title: 'Morning Routine',
        description: this.morningRoutine.slice(0, 2).join(' → '),
        priority: 'high'
      });
    }

    if (this.recommendedIngredients.length > 0) {
      this.recommendations.push({
        icon: '🧪',
        title: 'Key Ingredients',
        description: `Look for: ${this.recommendedIngredients.slice(0, 3).join(', ')}`,
        priority: 'high'
      });
    }

    if (this.nightRoutine.length > 0) {
      this.recommendations.push({
        icon: '🌙',
        title: 'Night Routine',
        description: this.nightRoutine.slice(0, 2).join(' → '),
        priority: 'medium'
      });
    }

    if (this.lifestyleTips.length > 0) {
      this.recommendations.push({
        icon: '💪',
        title: 'Lifestyle Tips',
        description: this.lifestyleTips[0],
        priority: 'medium'
      });
    }
  }

  buildDailyRoutine() {
    this.dailyRoutine = [];

    this.morningRoutine.forEach((step, i) => {
      const hour = 7 + Math.floor(i / 4);
      const minute = (i % 4) * 15;
      this.dailyRoutine.push({
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        icon: this.getMorningIcon(i),
        title: `Morning Step ${i + 1}`,
        description: step
      });
    });

    this.nightRoutine.forEach((step, i) => {
      const hour = 20 + Math.floor(i / 4);
      const minute = (i % 4) * 15;
      this.dailyRoutine.push({
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        icon: this.getNightIcon(i),
        title: `Night Step ${i + 1}`,
        description: step
      });
    });
  }

  getMorningIcon(index: number): string {
    const icons = ['🧼', '💧', '☀️', '🧴', '🌞', '✨'];
    return icons[index % icons.length];
  }

  getNightIcon(index: number): string {
    const icons = ['🧼', '🌙', '🌿', '💤', '⭐', '🛌'];
    return icons[index % icons.length];
  }

  handleAnalysisError(message: string) {
    this.isScanning = false;
    this.analysisStatus = 'error';
    this.errorMessage = message;
    this.faceDetected = false;
    this.analysisProgress = 0;

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    console.error('❌ Analysis failed:', message);
  }

  resetScan() {
    this.stopVideoStream();
    this.isScanning = false;
    this.faceDetected = false;
    this.capturedImage = null;
    this.analysisStatus = 'idle';
    this.errorMessage = '';
    this.analysisProgress = 0;

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    this.resetData();
    console.log('🔄 Scan reset - ready for new analysis');
  }

  resetData() {
    this.skinType = '';
    this.condition = '';
    this.morningRoutine = [];
    this.nightRoutine = [];
    this.recommendedIngredients = [];
    this.avoidIngredients = [];
    this.lifestyleTips = [];
    this.confidence = 0;
    this.regionsAnalyzed = 0;
    this.recommendations = [];
    this.dailyRoutine = [];
  }

  getStatusText(): string {
    switch(this.analysisStatus) {
      case 'idle': return 'Ready';
      case 'preparing': return 'Preparing Camera...';
      case 'scanning': return 'AI Analyzing...';
      case 'complete': return 'Analysis Complete ✓';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  }
}
