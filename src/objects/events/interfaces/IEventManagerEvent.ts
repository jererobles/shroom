import { FederatedEvent } from "pixi.js";
import { EventGroupIdentifier } from "./IEventGroup";

export interface IEventManagerEvent {
  tag: string | undefined;
  interactionEvent: FederatedEvent;
  stopPropagation(): void;
  skip(...identifiers: EventGroupIdentifierParam[]): void;
  skipExcept(...identifiers: EventGroupIdentifierParam[]): void;
}

export type EventGroupIdentifierParam =
  | EventGroupIdentifierParam[]
  | EventGroupIdentifier;
