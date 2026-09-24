import { Observable } from 'rxjs';
import {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CompleteTutorialResponse,
} from '@/domain/tenant/user/user.model';

export abstract class UserRepository {
  abstract changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse>;
  abstract completeTutorial(): Observable<CompleteTutorialResponse>;
}
