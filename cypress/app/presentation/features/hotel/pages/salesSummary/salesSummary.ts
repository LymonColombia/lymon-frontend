import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  HotelPageActionsDirective,
  HotelPageLayoutComponent,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import {
  bootstrapCalendar,
  bootstrapCurrencyDollar,
  bootstrapDownload,
  bootstrapEye,
  bootstrapFilter,
  bootstrapGraphUpArrow,
  bootstrapReceipt,
  bootstrapSearch,
} from '@ng-icons/bootstrap-icons';

interface SaleMetric {
  label: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}

interface Invoice {
  id: string;
  date: string;
  room: string;
  guest: string;
  nights: number;
  total: string;
  method: string;
  status: string;
  statusColor: string;
}

@Component({
  selector: 'app-sales-summary',
  imports: [
    HotelPageLayoutComponent,
    HotelPageActionsDirective,
    NgIcon,
    ButtonComponent,
    InputComponent,
  ],
  providers: [
    provideIcons({
      bootstrapCalendar,
      bootstrapCurrencyDollar,
      bootstrapDownload,
      bootstrapEye,
      bootstrapFilter,
      bootstrapGraphUpArrow,
      bootstrapReceipt,
      bootstrapSearch,
    }),
  ],
  templateUrl: './salesSummary.html',
  styleUrl: './salesSummary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesSummaryComponent {
  metrics: SaleMetric[] = [
    {
      label: 'Ventas Totales',
      value: '$1980.00',
      subtitle: 'Período seleccionado',
      icon: 'trending-up',
      color: '#009A44'
    },
    {
      label: 'Facturas Pagadas',
      value: '4',
      subtitle: '1 pendientes',
      icon: 'receipt',
      color: '#6CC24A'
    },
    {
      label: 'Ticket Promedio',
      value: '$396.00',
      subtitle: 'Por factura',
      icon: 'dollar',
      color: '#6CC24A'
    }
  ];

  weeklyData = [
    { day: 'Lun', value: 1080 },
    { day: 'Mar', value: 1680 },
    { day: 'Mié', value: 1440 },
    { day: 'Jue', value: 2040 },
    { day: 'Vie', value: 3000 },
    { day: 'Sáb', value: 3480 },
    { day: 'Dom', value: 2640 }
  ];

  paymentMethods = [
    { label: 'Tarjeta', percentage: 45, color: 'var(--color-primary-dark)' },
    { label: 'Efectivo', percentage: 30, color: 'var(--color-primary)' },
    { label: 'Transferencia', percentage: 25, color: 'var(--color-primary-light)' }
  ];

  invoices: Invoice[] = [
    {
      id: 'F-001',
      date: '8/2/2026',
      room: '101',
      guest: 'Juan Pérez',
      nights: 3,
      total: '$450.00',
      method: 'Tarjeta',
      status: 'Pagada',
      statusColor: 'color-mix(in srgb, var(--color-success) 16%, var(--color-bg-primary))'
    },
    {
      id: 'F-002',
      date: '8/2/2026',
      room: '205',
      guest: 'María González',
      nights: 2,
      total: '$400.00',
      method: 'Efectivo',
      status: 'Pagada',
      statusColor: 'color-mix(in srgb, var(--color-success) 16%, var(--color-bg-primary))'
    },
    {
      id: 'F-003',
      date: '8/2/2026',
      room: '310',
      guest: 'Carlos Ramírez',
      nights: 1,
      total: '$180.00',
      method: 'Transferencia',
      status: 'Pendiente',
      statusColor: 'color-mix(in srgb, var(--color-warning) 22%, var(--color-bg-primary))'
    },
    {
      id: 'F-004',
      date: '7/2/2026',
      room: '102',
      guest: 'Ana Martínez',
      nights: 4,
      total: '$600.00',
      method: 'Tarjeta',
      status: 'Pagada',
      statusColor: 'color-mix(in srgb, var(--color-success) 16%, var(--color-bg-primary))'
    },
    {
      id: 'F-005',
      date: '7/2/2026',
      room: '203',
      guest: 'Luis Torres',
      nights: 2,
      total: '$350.00',
      method: 'Efectivo',
      status: 'Pagada',
      statusColor: 'color-mix(in srgb, var(--color-success) 16%, var(--color-bg-primary))'
    }
  ];

  getBarHeight(value: number): number {
    const maxValue = Math.max(...this.weeklyData.map(d => d.value));
    return (value / maxValue) * 100;
  }

  getPieChartDashArray(percentage: number): string {
    const circumference = 2 * Math.PI * 40;
    const filled = (percentage / 100) * circumference;
    return `${filled} ${circumference - filled}`;
  }

  getPieChartOffset(previousPercentages: number[]): number {
    const circumference = 2 * Math.PI * 40;
    const totalPercentage = previousPercentages.reduce((sum, p) => sum + p, 0);
    return -((totalPercentage / 100) * circumference);
  }
}
