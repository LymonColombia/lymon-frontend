import { BrowseTheWeb } from '../abilities/browse-the-web.ability';
import { Actor } from './actor';

export class ManagerActor extends Actor {
  static named(name: string, browse: BrowseTheWeb): ManagerActor {
    return new ManagerActor(name, browse);
  }
}
