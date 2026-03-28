import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapEnvelope,
  bootstrapTelephone,
  bootstrapUpload,
  bootstrapCheck2Circle,
} from '@ng-icons/bootstrap-icons';

@Component({
  imports: [NgIcon],
  providers: [
    provideIcons({
      bootstrapEnvelope,
      bootstrapTelephone,
      bootstrapUpload,
      bootstrapCheck2Circle,
    }),
  ],
  selector: 'app-checkin',
  standalone: true,
  templateUrl: './checkin.html',
  styleUrls: ['./checkin.css'],
})
export class CheckinComponent {}
