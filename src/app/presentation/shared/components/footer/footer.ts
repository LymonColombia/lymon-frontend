import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'footer',
    '[class.footer--dark]': 'dark()',
  },
})
export class FooterComponent {
  readonly dark = input(false);
  readonly currentYear = new Date().getFullYear();
}
