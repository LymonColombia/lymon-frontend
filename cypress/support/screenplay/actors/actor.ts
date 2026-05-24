export type CypressTask = () => void;
export type CypressQuestion<T> = () => T;

export class Actor {
  protected constructor(public readonly name: string) {}

  static named(name: string): Actor {
    return new Actor(name);
  }

  attemptsTo(...tasks: CypressTask[]): void {
    for (const task of tasks) {
      task();
    }
  }

  asks<T>(question: CypressQuestion<T>): T {
    return question();
  }
}
