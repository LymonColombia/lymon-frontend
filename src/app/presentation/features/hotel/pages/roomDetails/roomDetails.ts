import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-room-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './roomDetails.html',
  styleUrl: './roomDetails.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomDetailsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly searchForm: FormGroup;

  constructor() {
    this.searchForm = this.fb.group({
      checkIn: [''],
      checkOut: [''],
      guests: [2]
    });
  }

  onSearch(): void {
    const formValue = this.searchForm.value;
    this.router.navigate(['/hotel/booking'], {
      queryParams: {
        checkIn: formValue.checkIn,
        checkOut: formValue.checkOut,
        guests: formValue.guests
      }
    });
  }

  onGoBack(): void {
    this.router.navigate(['/hotel/booking']);
  }
}
