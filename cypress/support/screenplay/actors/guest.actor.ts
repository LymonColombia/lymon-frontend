import { Actor } from './actor';

export class GuestActor extends Actor {
  static override named(name: string): GuestActor {
    return new GuestActor(name);
  }
}

export { CypressTask, CypressQuestion } from './actor';
