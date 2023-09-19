import { HostRoot } from "./ReactWorkTags";

const concureentQueue = [];
let concurentQueuesIndex = 0;

export function finishQueueingConCurrentUpdates() {
  const endIndex = concurentQueuesIndex;
  concurentQueuesIndex = 0;
  let i = 0;
  while (i < endIndex) {
    const fiber = concureentQueue[i++];
    const queue = concureentQueue[i++];
    const update = concureentQueue[i++];
    if (queue !== null && update !== null) {
      const pending = queue.pending;
      //构建Update更新循环列表
      if (pending === null) {
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }
  }
}
/**
 *  把更新添加到更新队列中
 * @param {*} fiber 函数组件对应的fiber
 * @param {*} queue 要更新的Hook对的更新队列
 * @param {*} update 更新对象
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update) {
  enqueueUpdate(fiber, queue, update);
  return getRootForUpdatedFiber(fiber);
}

function getRootForUpdatedFiber(sourceFiber) {
  let node = sourceFiber;
  let parent = node.return;
  while (parent !== null) {
    node = parent;
    parent = node.return;
  }
  //FiberRootNode div#root
  return node.tag === HostRoot ? node.stateNode : null;
}

function enqueueUpdate(fiber, queue, update) {
  concureentQueue[concurentQueuesIndex++] = fiber; // 函数组件对应的fiber
  concureentQueue[concurentQueuesIndex++] = queue; //要更新的Hook对应的更新队列
  concureentQueue[concurentQueuesIndex++] = update; //更新对象
}

/**
 * 向上找到根节点
 */
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber; //当前Fiber
  let parent = sourceFiber.return; // 当前fiber的父fiber
  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    return node.stateNode;
  }

  return null;
}
