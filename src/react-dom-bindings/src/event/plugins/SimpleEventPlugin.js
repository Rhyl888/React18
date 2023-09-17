import {
  registerSimpleEvents,
  topLevelEventsToReactNames,
} from "../DOMEventProperties";
import { IS_CAPTURE_PHASE } from "../EventSystemFlags";
import { accumulateSinglePhaseListeners } from "../DOMPluginEventSystem";
import { SyntheticMouseEvent } from "../SyntheticEvent";

/**
 * 把药执行的回调函数添加到dispatchQueue中
 * @param {*} dispacthQueue 派发队列， 里面放置我们的监听函数
 * @param {*} domEventName DOM事件名 click等
 * @param {*} targetInst 目标fiber
 * @param {*} nativeEvent 原生事件
 * @param {*} nativeEventTarget 原生事件源
 * @param {*} eventSystemFlags 事件系统标题 0 代表冒泡 4代表俘获
 * @param {*} targetContainer 目标容器div#root
 */
function extractEvents(
  dispacthQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer
) {
  const reactName = topLevelEventsToReactNames.get(domEventName); //click ==> onClick
  let SyntheticEventCtor; //合成事件的构造函数
  switch (domEventName) {
    case "click":
      SyntheticEventCtor = SyntheticMouseEvent;
      break;
    default:
      break;
  }
  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0; //是否是俘获阶段
  const listeners = accumulateSinglePhaseListeners(
    targetInst,
    reactName,
    nativeEvent.type,
    isCapturePhase
  );
  //有要执行的监听函数
  if (listeners.length > 0) {
    const event = new SyntheticEventCtor(
      reactName,
      domEventName,
      null,
      nativeEvent,
      nativeEventTarget
    );
    dispacthQueue.push({
      event, //合成事件的实例
      listeners, //监听函数数组
    });
  }
}

export { registerSimpleEvents as registerEvents, extractEvents };
