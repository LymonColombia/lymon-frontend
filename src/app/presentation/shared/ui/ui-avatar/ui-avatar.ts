import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Circle with the initials of a name. Decorative: the name is always shown next to it. */
@Component({
  selector: 'app-ui-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-avatar.html',
  styleUrl: './ui-avatar.css',
  host: {
    'aria-hidden': 'true',
    '[class.ui-avatar--sm]': "size() === 'sm'",
  },
})
export class UiAvatarComponent {
  readonly name = input('');
  readonly size = input<'sm' | 'md'>('md');

  protected readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = parts[0].charAt(0);
    const second = parts.length > 1 ? parts[1].charAt(0) : (parts[0].charAt(1) ?? '');
    return (first + second).toUpperCase();
  });
}
