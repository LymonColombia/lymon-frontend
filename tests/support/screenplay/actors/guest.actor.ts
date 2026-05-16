import { BrowseTheWeb } from '../abilities/browse-the-web.ability';
import { Actor } from './actor';

export class GuestActor extends Actor {
  static named(name: string, browse: BrowseTheWeb): GuestActor {
    return new GuestActor(name, browse);
  }
}

export { ActorTask, ActorQuestion } from './actor.types';
