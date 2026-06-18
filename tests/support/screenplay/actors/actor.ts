import { BrowseTheWeb } from '../abilities/browse-the-web.ability';
import { ActorTask, ActorQuestion } from './actor.types';

export class Actor {
  protected constructor(
    public readonly name: string,
    public readonly browse: BrowseTheWeb,
  ) {}

  static named(name: string, browse: BrowseTheWeb): Actor {
    return new Actor(name, browse);
  }

  async attemptsTo(...tasks: ActorTask[]): Promise<void> {
    for (const task of tasks) {
      await task(this);
    }
  }

  async asks<T>(question: ActorQuestion<T>): Promise<T> {
    return question(this);
  }
}
