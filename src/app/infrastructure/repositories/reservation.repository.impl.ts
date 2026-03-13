import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReservationRepository } from '@/domain/repositories/reservation.repository';
import { Reservation } from '@/domain/entities/reservation.model';
import { environment } from '@env';

@Injectable({
  providedIn: 'root',
})
export class ReservationRepositoryImpl extends ReservationRepository {
  private readonly baseUrl = environment.apiUrl;
  private readonly endpoint = environment.reservations.endpoint;

  constructor(private http: HttpClient) {
    super();
  }

  getReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}${this.endpoint}`);
  }
}
