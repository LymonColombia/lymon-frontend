import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { GetAuditLogsUseCase } from '@/domain/use-cases/audit/get-audit-logs.use-case';
import { AuditAction, AuditEntityType, AuditLogEntry } from '@/domain/entities/audit-log.model';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapInfoCircle, bootstrapSearch, bootstrapFileEarmarkText } from '@ng-icons/bootstrap-icons';

const LIMIT = 20;

@Component({
  selector: 'app-audit-log',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HotelPageLayoutComponent, ReactiveFormsModule, NgIcon],
  providers: [
    provideIcons({
      bootstrapInfoCircle,
      bootstrapSearch,
      bootstrapFileEarmarkText,
    }),
  ],
  templateUrl: './auditLog.html',
  styleUrl: './auditLog.css',
})
export class AuditLogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly getAuditLogsUseCase = inject(GetAuditLogsUseCase);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly forbiddenError = signal(false);
  readonly items = signal<AuditLogEntry[]>([]);
  readonly total = signal(0);
  readonly currentPage = signal(1);

  readonly totalPages = computed(() => Math.ceil(this.total() / LIMIT));
  readonly showingFrom = computed(() => (this.currentPage() - 1) * LIMIT + 1);
  readonly showingTo = computed(() => Math.min(this.currentPage() * LIMIT, this.total()));
  readonly hasFilters = computed(() => {
    const v = this.filters.getRawValue();
    return !!(v.userId || v.action || v.entityType || v.dateFrom || v.dateTo);
  });

  readonly AUDIT_ACTIONS: AuditAction[] = [
    'AUTH_LOGIN',
    'TENANT_REGISTERED',
    'TENANT_PROFILE_UPDATED',
    'USER_INVITED',
    'USER_PASSWORD_CHANGED',
    'USER_EMAIL_VERIFIED',
    'PROPERTY_CREATED',
    'PROPERTY_UPDATED',
    'PROPERTY_DELETED',
    'UNIT_CREATED',
    'UNIT_UPDATED',
    'UNIT_DELETED',
    'INCIDENT_REPORT_CREATED',
    'INCIDENT_REPORT_UPDATED',
    'INCIDENT_REPORT_DELETED',
  ];

  readonly ENTITY_TYPES: AuditEntityType[] = [
    'AUTH',
    'TENANT',
    'USER',
    'PROPERTY',
    'UNIT',
    'INCIDENT_REPORT',
  ];

  readonly filters = this.fb.group({
    userId: [''],
    action: ['' as AuditAction | ''],
    entityType: ['' as AuditEntityType | ''],
    dateFrom: [''],
    dateTo: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.load();
  }

  clearFilters(): void {
    this.filters.reset();
    this.currentPage.set(1);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.forbiddenError.set(false);

    const { userId, action, entityType, dateFrom, dateTo } = this.filters.getRawValue();

    this.getAuditLogsUseCase
      .execute({
        page: this.currentPage(),
        limit: LIMIT,
        userId: userId || undefined,
        action: (action as AuditAction) || undefined,
        entityType: (entityType as AuditEntityType) || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.isLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (err.status === 403) {
            this.forbiddenError.set(true);
          } else if (err.status === 401) {
            this.errorMessage.set('Tu sesión ha expirado. Vuelve a iniciar sesión.');
          } else {
            this.errorMessage.set('Error al cargar los registros. Inténtalo de nuevo.');
          }
        },
      });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  actionBadgeClass(action: AuditAction): string {
    if (action.endsWith('_DELETED')) return 'badge badge-red';
    if (
      action.endsWith('_CREATED') ||
      action === 'USER_INVITED' ||
      action === 'USER_EMAIL_VERIFIED' ||
      action === 'TENANT_REGISTERED'
    )
      return 'badge badge-green';
    if (action.endsWith('_UPDATED') || action === 'USER_PASSWORD_CHANGED')
      return 'badge badge-yellow';
    return 'badge badge-blue';
  }

  formatAction(action: AuditAction): string {
    return action.replace(/_/g, ' ');
  }

  formatMetadata(metadata: Record<string, unknown> | undefined): string {
    if (!metadata || Object.keys(metadata).length === 0) return '—';
    return Object.entries(metadata)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const cur = this.currentPage();
    const delta = 2;
    const pages: number[] = [];
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) {
      pages.push(i);
    }
    return pages;
  }
}
