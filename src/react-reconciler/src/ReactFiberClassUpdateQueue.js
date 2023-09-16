import { markUpdateLaneFromFiberToRoot } from "./ReactFiberConcurrentUpdate";
import assign from "shared/assign";
const UpdateState = 0;
export function initialUpdateQueue(fiber) {
  //创建一个新的更新队列
  //pending是一个循环链表
  const queue = {
    shared: {
      pending: null,
    },
  };
  fiber.updateQueue = queue;
}

export function createUpdate() {
  const update = { tag: UpdateState };
  return update;
}

export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  const pending = updateQueue.shared.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  updateQueue.shared.pending = update;
  return markUpdateLaneFromFiberToRoot(fiber);
}

/**
 * 根据老状态和更新队列中的更新计算最新的状态
 * @param {*} workInProgress  要计算的fiber
 */
export function processUpdateQueue(workInProgress) {
  const queue = workInProgress.updateQueue;
  const pendingQueue = queue.shared.pending;
  //如果有更新或者更新队列里面有值
  if (pendingQueue !== null) {
    //清除等待生效的更新
    queue.shared.pending = null;
    //获取更新队列中的最后一个更新 update = {payload :{element : 'h1'}}
    const lastPendingUpdate = pendingQueue;
    //指向第一个更新
    const firstPendingUpdate = lastPendingUpdate.next;
    //把更新链表剪开，变成单链表
    lastPendingUpdate.next = null;
    //获取老状态 根节点调用的第一次是null
    let newState = workInProgress.memoizedState;
    let update = firstPendingUpdate;
    while (update) {
      //根据老状态和更新 计算新状态
      newState = getStateFromUpdate(update, newState);
      update = update.next;
    }
    //把最终计算的状态赋值给memoizedState
    workInProgress.memoizedState = newState;
  }

  //清楚等待生效的更新
  queue.shared.pending = null;
}

/**
 * 根据老状态和更新 计算新状态
 * @param {*} update 更新的对象 其有很多类型
 * @param {*} prevState
 * @returns
 */
function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update;
      return assign({}, prevState, payload);
  }
}
