import { Component, ChangeDetectionStrategy, output } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'header',
  },
})
export class HeaderComponent {
  readonly logoClicked = output<void>();

  onLogoClick(): void {
    this.logoClicked.emit();
  }
}
