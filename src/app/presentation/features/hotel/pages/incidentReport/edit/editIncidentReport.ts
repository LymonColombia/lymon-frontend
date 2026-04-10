import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormArray,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapPlusLg, bootstrapXLg, bootstrapPencilSquare } from '@ng-icons/bootstrap-icons';
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { UpdateIncidentReportUseCase } from '@/domain/use-cases/update-incident-report.use-case';
import { IncidentReport } from '@/domain/entities/incident-report.model';

const URL_PATTERN = /^https?:\/\/.+/;

@Component({
  selector: 'app-edit-incident-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIcon,
    HotelPageLayoutComponent,
    ButtonComponent,
  ],
  providers: [provideIcons({ bootstrapPlusLg, bootstrapXLg, bootstrapPencilSquare })],
  templateUrl: './editIncidentReport.html',
  styleUrl: './editIncidentReport.css',
})
export class EditIncidentReportComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly updateUseCase = inject(UpdateIncidentReportUseCase);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly reportId = signal<string>('');
  readonly notFound = signal(false);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    attachmentUrls: this.fb.array([]),
  });

  get attachmentUrlsArray(): FormArray {
    return this.form.controls.attachmentUrls as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); return; }
    this.reportId.set(id);

    const state = this.router.currentNavigation()?.extras.state as { report?: IncidentReport } | undefined;
    const report = state?.report ?? (history.state as { report?: IncidentReport })?.report;

    if (!report) { this.notFound.set(true); return; }

    this.form.patchValue({ title: report.title, description: report.description });
    (report.attachmentUrls ?? []).forEach((url) => this.addAttachmentUrl(url));
  }

  addAttachmentUrl(value = ''): void {
    this.attachmentUrlsArray.push(
      this.fb.control(value, [Validators.required, Validators.pattern(URL_PATTERN)]),
    );
  }

  removeAttachmentUrl(index: number): void {
    this.attachmentUrlsArray.removeAt(index);
  }

  asAbstractControl(ctrl: AbstractControl): AbstractControl {
    return ctrl;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { title, description, attachmentUrls } = this.form.getRawValue();

    this.updateUseCase
      .execute(this.reportId(), {
        title: title || undefined,
        description: description || undefined,
        attachmentUrls: (attachmentUrls as string[]).length > 0 ? (attachmentUrls as string[]) : undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/incident-report/list']);
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          if (err.status === 403) {
            this.errorMessage.set('No tienes permiso para editar esta novedad.');
          } else if (err.status === 404) {
            this.errorMessage.set('La novedad no fue encontrada.');
          } else if (err.status === 400) {
            this.errorMessage.set('Datos inválidos. Verifica los campos e intenta de nuevo.');
          } else {
            this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
          }
        },
      });
  }

  get titleControl() { return this.form.controls.title; }
  get descriptionControl() { return this.form.controls.description; }
}
