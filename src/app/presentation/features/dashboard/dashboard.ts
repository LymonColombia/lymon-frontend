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

  reservationStats = computed(() => {
    const reservations = this.reservations();
    const stats = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthLabel = d.toLocaleString('es-ES', { month: 'short' });
      
      const finishedInMonth = reservations.filter(r => {
        const rDate = new Date(r.checkOut);
        return r.status === 'finished' && 
               rDate.getMonth() === month && 
               rDate.getFullYear() === year;
      });

      const count = finishedInMonth.length;
      const revenue = finishedInMonth.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
      
      stats.push({ monthLabel, count, revenue });
    }

    const maxCount = Math.max(...stats.map(s => s.count), 1); 
    const maxRevenue = Math.max(...stats.map(s => s.revenue), 1);

    return stats.map(s => ({
      ...s,
      countHeight: (s.count / maxCount) * 100, 
      revenueY: 130 - ((s.revenue / maxRevenue) * 80)
    }));
  });

  revenueChartPath = computed(() => {
    const stats = this.reservationStats();
    if (stats.length === 0) return '';
    

    return 'M ' + stats.map((s, i) => {
      const x = 40 + (i * 48); 
      return `${x} ${s.revenueY}`;
    }).join(' L ');
  });

  revenueChartPoints = computed(() => {
    const stats = this.reservationStats();
    return stats.map((s, i) => ({
      x: 40 + (i * 48),
      y: s.revenueY,
      value: s.revenue,
      label: s.monthLabel
    }));
  });

  revenueAxisLabels = computed(() => {
    const stats = this.reservationStats();
    const maxRevenue = Math.max(...stats.map(s => s.revenue), 100);
    return [
      Math.round(maxRevenue * 0.5),
      Math.round(maxRevenue * 0.75),
      Math.round(maxRevenue)
    ];
  });

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


