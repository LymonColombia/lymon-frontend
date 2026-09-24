export type NotificationType = 'reservation' | 'labor';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  detectedAt: Date;
  read: boolean;
}
