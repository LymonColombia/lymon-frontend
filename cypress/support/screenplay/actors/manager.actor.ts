import { Actor } from './actor';

export class ManagerActor extends Actor {
  static override named(name: string): ManagerActor {
    return new ManagerActor(name);
  }
}
