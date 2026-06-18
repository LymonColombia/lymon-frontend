import { Actor } from './actor';

export type ActorTask = (actor: Actor) => Promise<void>;
export type ActorQuestion<T> = (actor: Actor) => Promise<T>;
