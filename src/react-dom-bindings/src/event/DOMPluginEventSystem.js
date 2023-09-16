import { allNativeEvents } from "./EventRegistry";
export function listenToAllSupportedEvents(rootContainerElement) {
  allNativeEvents.forEach((domEventName) => {
    console.log("domEventName", domEventName);
  });
}
