# UI conventions

The rules every component follows. New components must follow them. A few older files
still break them, so don't copy a pattern just because it exists. The long version, with
examples, is in
[`.agents/skills/angular-component/SKILL.md`](../../.agents/skills/angular-component/SKILL.md).

## 1. Pages vs components

| | Page (smart) | Component (dumb) |
|---|---|---|
| Lives in | `presentation/<audience>/features/<feature>/pages/<page>/` | `pages/<page>/components/`, `presentation/<audience>/components/`, or `presentation/shared/components/` |
| Gets data from | use cases (`inject(GetXUseCase)`), route params | `input()` only |
| Talks back with | the router, use cases | `output()` only |
| Holds | the page's state in signals: data, `loading`, `error` | only UI state (open/closed, hover) |

- A component used by one page lives in that page's `components/` folder. Move it up to
  `<audience>/components/` once a second page needs it, and to `shared/components/` once
  both audiences need it.
- Shared primitives (`button`, `input`, `password-input`, `select`, `modal`, `calendar`,
  `breadcrumb`, `location-map`, …) have no domain knowledge. If a component imports a
  domain model, it isn't shared.

## 2. Component rules

```typescript
@Component({
  selector: 'app-guest-card',
  imports: [ButtonComponent, NgIcon],
  providers: [provideIcons({ bootstrapPersonFill })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.selected]': 'selected()' },
  templateUrl: './guest-card.html',
  styleUrl: './guest-card.css',
})
export class GuestCardComponent {
  readonly guest = input.required<CrmGuest>();
  readonly selected = input(false);
  readonly opened = output<string>();
}
```

| Do | Don't |
|---|---|
| Leave out `standalone` (it's the default) | `standalone: true` |
| `ChangeDetectionStrategy.OnPush` on every component | the default strategy |
| `input()`, `input.required()`, `model()` | `@Input()` |
| `output()` | `@Output()` with `EventEmitter` |
| `inject()` | constructor injection |
| `host: { ... }` | `@HostBinding`, `@HostListener` |
| `@if`, `@for (x of xs; track x.id)`, `@switch` | `*ngIf`, `*ngFor`, `*ngSwitch` |
| `[class.active]="isActive()"`, `[style.width.px]="w()"` | `ngClass`, `ngStyle` |
| `signal()`, `computed()` for state | mutable fields that the template reads |
| `takeUntilDestroyed(this.destroyRef)` on subscriptions | manual `ngOnDestroy` unsubscribe |

## 3. Files and names

- One folder per component with three files: `name.ts`, `name.html`, `name.css`, plus
  `name.spec.ts` when it has logic. Files have no `.component` suffix.
- Class names end in `Component` (`GuestProfileComponent`), and selectors start with `app-`.
  A few older pages (`GuestCartPage`, `TenantReservations`) predate this rule.
- Page-local types go in a `<page>.models.ts` next to the page (for example
  `cart.models.ts`). Types the domain cares about go in the domain model.

## 4. Styling

- Plain CSS per component. Global styles and fonts live in `src/styles.css` and
  `public/fonts/`.
- Shared form styling for the auth pages is in `presentation/shared/styles/auth-form.css`.
- Images and extra SVG icons are in `public/images/` and `public/extra-icons/`.

## 5. Icons

Use `@ng-icons` with the Bootstrap set: import `NgIcon`, register the icons with
`provideIcons({ ... })` in the component's `providers`, and write
`<ng-icon name="bootstrapCheckCircleFill" aria-hidden="true" />`. Custom SVGs in
`public/extra-icons/` load by name through the icon loader set up in `app.config.ts`.

## 6. Text and accessibility

- Every label, message, placeholder and validation error is in **Spanish**. Code, CSS
  classes and comments are in English.
- Format money and dates with the helpers in `presentation/shared/utils/`
  (`price-formatter.ts`, `date-formatter.util.ts`), not by hand.
- Decorative icons get `aria-hidden="true"`. Icon-only buttons get an `aria-label`.
- Use a native `<button>` for actions and `<a routerLink>` for navigation.
