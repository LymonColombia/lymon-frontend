import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapEnvelope,
  bootstrapTelephone,
  bootstrapPerson,
  bootstrapCardText,
  bootstrapShieldCheck,
  bootstrapPen,
} from '@ng-icons/bootstrap-icons';

@Component({
  imports: [CommonModule, HotelPageLayoutComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapEnvelope,
      bootstrapTelephone,
      bootstrapPerson,
      bootstrapCardText,
      bootstrapShieldCheck,
      bootstrapPen,
    }),
  ],
  selector: 'app-checkin',
  standalone: true,
  templateUrl: './checkin.html',
  styleUrls: ['./checkin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckinComponent implements AfterViewInit {
  @ViewChild('signatureCanvas')
  private readonly signatureCanvas?: ElementRef<HTMLCanvasElement>;

  private signatureContext: CanvasRenderingContext2D | null = null;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;

  readonly steps = [
    'Informacion personal',
    'Datos legales',
    'Contacto de emergencia',
    'Firma y confirmacion',
  ] as const;

  readonly currentStep = signal(1);
  readonly totalSteps = this.steps.length;

  readonly progressPercent = computed(() => (this.currentStep() / this.totalSteps) * 100);
  readonly currentStepLabel = computed(() => this.steps[this.currentStep() - 1]);
  readonly isFirstStep = computed(() => this.currentStep() === 1);
  readonly isLastStep = computed(() => this.currentStep() === this.totalSteps);

  readonly reservationSummary = {
    guestName: 'Juliana',
    room: 'Suite Ejecutiva',
    checkIn: '15 Feb 2026 - 3:00 PM',
    checkOut: '18 Feb 2026 - 12:00 PM',
    nights: 3,
    guests: 2,
    total: '$600.000',
  };

  readonly selectedIdentityFileName = signal('Ningun archivo seleccionado');

  goToPreviousStep(): void {
    this.currentStep.update((step) => Math.max(1, step - 1));
    this.trySetupSignatureCanvas();
  }

  goToNextStep(): void {
    this.currentStep.update((step) => Math.min(this.totalSteps, step + 1));
    this.trySetupSignatureCanvas();
  }

  submitCheckin(): void {
    // Placeholder until backend integration for step 4 submission.
    console.info('Check-in listo para enviar.');
  }

  ngAfterViewInit(): void {
    this.setupSignatureCanvas();
  }

  onIdentityFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);

    this.selectedIdentityFileName.set(file?.name ?? 'Ningun archivo seleccionado');
  }

  startDrawing(event: PointerEvent): void {
    if (!this.signatureContext) return;

    const point = this.getCanvasPoint(event);
    this.isDrawing = true;
    this.lastX = point.x;
    this.lastY = point.y;

    this.signatureContext.beginPath();
    this.signatureContext.moveTo(point.x, point.y);
    (event.target as Element).setPointerCapture?.(event.pointerId);
  }

  draw(event: PointerEvent): void {
    if (!this.signatureContext || !this.isDrawing) return;

    const point = this.getCanvasPoint(event);
    this.signatureContext.lineTo(point.x, point.y);
    this.signatureContext.stroke();

    this.lastX = point.x;
    this.lastY = point.y;
  }

  stopDrawing(): void {
    if (!this.signatureContext) return;

    this.signatureContext.closePath();
    this.isDrawing = false;
  }

  clearSignature(): void {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas || !this.signatureContext) return;

    this.signatureContext.clearRect(0, 0, canvas.width, canvas.height);
  }

  private setupSignatureCanvas(): void {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = globalThis.devicePixelRatio || 1;

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#214a2d';
    this.signatureContext = ctx;
  }

  private trySetupSignatureCanvas(): void {
    if (this.currentStep() !== 4) return;

    requestAnimationFrame(() => {
      this.setupSignatureCanvas();
    });
  }

  private getCanvasPoint(event: PointerEvent): { x: number; y: number } {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
}
