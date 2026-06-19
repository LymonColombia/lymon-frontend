export interface Reservation {
    id: string;
    tenantId: string;
    propertyId: string;
    unitId: string;
    guestId: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    source: string;
    status: 'active' | 'pending' | 'finished' | 'confirmed' | 'cancelled';
    guestsCount: number;
    pricePerNight: number;
    totalPrice: number;
    notes?: string;
    externalReservationId?: string;
    cancelledAt?: string;
    cancellationReason?: string;
    checkInActualAt?: string;
    checkOutActualAt?: string;
    createdAt: string;
    updatedAt: string;
    guestName?: string; 
    room?: string; 
}
