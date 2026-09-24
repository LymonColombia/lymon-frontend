import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapCheckCircle,
  bootstrapExclamationTriangle,
  bootstrapX,
} from '@ng-icons/bootstrap-icons';
import { Toast, ToastService } from '@/presentation/tenant/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgIcon],
  providers: [
    provideIcons({
      bootstrapCheckCircle,
      bootstrapExclamationTriangle,
      bootstrapX,
    }),
  ],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  iconName(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'bootstrapCheckCircle';
      case 'error':
      case 'warning':
      case 'info':
      default:
        return 'bootstrapExclamationTriangle';
    }
  }
}
