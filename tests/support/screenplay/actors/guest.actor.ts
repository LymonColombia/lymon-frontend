import { BrowseTheWeb } from '../abilities/browse-the-web.ability';

export type ActorTask = (actor: GuestActor) => Promise<void>;
export type ActorQuestion<T> = (actor: GuestActor) => Promise<T>;

export class GuestActor {
  private constructor(
    public readonly name: string,
    public readonly browse: BrowseTheWeb,
  ) {}

  static named(name: string, browse: BrowseTheWeb): GuestActor {
    return new GuestActor(name, browse);
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
