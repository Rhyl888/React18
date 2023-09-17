import { registerTwoPhaseEvent } from "./EventRegistry";
const simpleEventPluginEvents = ["click"];
export const topLevelEventsToReactNames = new Map();

function registerSimpleEvent(domEveentName, reactName) {
  topLevelEventsToReactNames.set(domEveentName, reactName);
  registerTwoPhaseEvent(reactName, [domEveentName]);
}

export function registerSimpleEvents() {
  for (let i = 0; i < simpleEventPluginEvents.length; i++) {
    const eventName = simpleEventPluginEvents[i];
    const domEventName = eventName.toLowerCase();
    const capitalizeEvent = eventName[0].toUpperCase() + eventName.slice(1);
    registerSimpleEvent(domEventName, `on${capitalizeEvent}`); //click onClick
  }
}
