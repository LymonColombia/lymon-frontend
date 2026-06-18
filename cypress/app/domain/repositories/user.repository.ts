import { Observable } from 'rxjs';
import { ChangePasswordRequest, ChangePasswordResponse } from '@/domain/entities/user.model';

export abstract class UserRepository {
  abstract changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse>;
}
