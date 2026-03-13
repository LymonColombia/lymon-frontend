import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '@/presentation/shared/components/sidebar/sidebar';
import { GetReservationsUseCase } from '@/domain/use-cases/reservation/get-reservations.use-case';
import { Reservation } from '@/domain/entities/reservation.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./dashboard.css'],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  private getReservationsUseCase = inject(GetReservationsUseCase);
  
  reservations = signal<Reservation[]>([]);
  
  occupiedRooms = computed(() => this.reservations().filter(r => r.status === 'active').length);
  
  activeGuests = computed(() => 
    this.reservations()
      .filter(r => r.status === 'active')
      .reduce((total, r) => total + (r.guestsCount || 0), 0)
  );

  monthlyRevenue = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return this.reservations()
      .filter(r => {
        const checkIn = new Date(r.checkIn);
        return checkIn.getMonth() === currentMonth && checkIn.getFullYear() === currentYear && r.status !== 'cancelled';
      })
      .reduce((total, r) => total + (r.totalPrice || 0), 0);
  });

  occupancyRate = computed(() => {
    const totalCapacity = 120;
    const occupied = this.occupiedRooms();
    return totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 100) : 0;
  });

  recentReservations = computed(() => 
    [...this.reservations()]
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
      .slice(0, 5)
  );

  ngOnInit() {
    this.loadReservations();
  }

  loadReservations() {
    this.getReservationsUseCase.execute().subscribe({
      next: (data) => {
        this.reservations.set(data);
      },
      error: (err) => console.error('Error loading reservations', err)
    });
  }
}


