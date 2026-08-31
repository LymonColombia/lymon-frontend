import { Routes } from '@angular/router';
import { LyhostPageComponent } from '@/presentation/public/features/landing/pages/lyhost-page/lyhost-page';
import { BookingComponent } from '@/presentation/public/features/booking/pages/booking/booking';
import { RoomDetailsComponent } from '@/presentation/public/features/room-details/pages/room-details/room-details';
import { ExperienceComponent } from '@/presentation/public/features/experiences/pages/experiences/experiences';
import { ExperienceDetailPageComponent } from '@/presentation/public/features/experiences/pages/experience-detail-page/experience-detail-page';

/** Catalog views. No guard: reachable by anyone, signed in or not. */
export const publicRoutes: Routes = [
  { path: 'lyhost', component: LyhostPageComponent },
  { path: 'booking', component: BookingComponent },
  { path: 'room-details', component: RoomDetailsComponent },
  { path: 'room-details/:unitId', component: RoomDetailsComponent },
  { path: 'experiences', component: ExperienceComponent },
  { path: 'experiences/:id', component: ExperienceDetailPageComponent },
];
