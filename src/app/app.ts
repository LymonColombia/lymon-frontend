import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TokenRefreshSchedulerService } from '@/infrastructure/tenant/services/token-refresh-scheduler.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor() {
    inject(TokenRefreshSchedulerService);
  }
}
