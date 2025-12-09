import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { HeartRateComponent } from './features/heart-rate/heart-rate.component';
import { BodyTempComponent } from './features/body-temp/body-temp.component';
import { RoomTempComponent } from './features/room-temp/room-temp.component';
import { GasDetectComponent } from './features/gas-detect/gas-detect.component';
import { FaceAnalysisComponent } from './features/face-analysis/face-analysis.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'heart', component: HeartRateComponent },
  { path: 'body-temp', component: BodyTempComponent },
  { path: 'room-temp', component: RoomTempComponent },
  { path: 'gas', component: GasDetectComponent },
  { path: 'face', component: FaceAnalysisComponent }
];