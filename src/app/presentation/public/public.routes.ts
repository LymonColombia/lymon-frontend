import { Routes } from '@angular/router';
import { LyhostPageComponent } from '@/presentation/public/features/landing/pages/lyhost-page/lyhost-page';
import {
  LYHOST_LANG,
  LYHOST_LANGS,
  LYHOST_TEXT,
  LYHOST_TEXTS,
  lyhostLandingPath,
} from '@/presentation/public/features/landing/pages/lyhost-page/i18n/lyhost-i18n';
import { BookingComponent } from '@/presentation/public/features/booking/pages/booking/booking';
import { RoomDetailsComponent } from '@/presentation/public/features/room-details/pages/room-details/room-details';
import { ExperienceComponent } from '@/presentation/public/features/experiences/pages/experiences/experiences';
import { ExperienceDetailPageComponent } from '@/presentation/public/features/experiences/pages/experience-detail-page/experience-detail-page';

/** Catalog views. No guard: reachable by anyone, signed in or not. */
export const publicRoutes: Routes = [
  // The landing lives at /lyhost/es and /lyhost/en; /lyhost and unknown languages go to the browser's language.
  // One route per language (not /lyhost/:lang) so switching language rebuilds the page with the new text.
  { path: 'lyhost', pathMatch: 'full', redirectTo: lyhostLandingPath },
  ...LYHOST_LANGS.map((lang) => ({
    path: `lyhost/${lang}`,
    component: LyhostPageComponent,
    providers: [
      { provide: LYHOST_LANG, useValue: lang },
      { provide: LYHOST_TEXT, useValue: LYHOST_TEXTS[lang] },
    ],
  })),
  { path: 'lyhost/:lang', redirectTo: lyhostLandingPath },
  { path: 'booking', component: BookingComponent },
  { path: 'room-details', component: RoomDetailsComponent },
  { path: 'room-details/:unitId', component: RoomDetailsComponent },
  { path: 'experiences', component: ExperienceComponent },
  { path: 'experiences/:id', component: ExperienceDetailPageComponent },
];
