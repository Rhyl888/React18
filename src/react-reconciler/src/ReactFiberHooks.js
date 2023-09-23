import ReactSharedInternals from "shared/ReactSharedInternals";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { enqueueConcurrentHookUpdate } from "./ReactFiberConcurrentUpdates";
import { Passive as PassiveEffect } from "./ReactFiberFlags";
import { HasEffect as HookHasEffect, Passive as HookPassive } from "./ReactHookEffectTags";

let currentlyRenderingFiber = null; //当前正在渲染的fiber
let workInProgressHook = null; //当前的hook
let currentHook = null; //老hook

const { ReactCurrentDispatcher } = ReactSharedInternals;
const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
  useEffect: mountEffect
};
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect
};

function updateEffect(create, deps) {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy;
  //上一个老hook
  if (currentHook !== null) {
    //获取此useEffect这个hook上老的effect对象 create deps destroyed() {
    const preveEffect = currentHook.memoizedState;
    destroy = preveEffect.destory;
    if (nextDeps !== null) {
      const preveDeps = preveEffect.deps;
      //用新数组和老数组进行对比，如果一样的话
      if (areHookInputsEqual(nextDeps, preveDeps)) {
        //不管要不要重新执行，都需要把新的effect组成完整的循环链表放到fiber.updateQueue中
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }
  //如果要执行的话需要修改fiber的flags
  currentlyRenderingFiber.flags |= fiberFlags;
  //如果要执行的话，添加 这个HookHasEffect flag
  hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, destroy, nextDeps);
}

function areHookInputsEqual(nextDeps, preDeps) {
  if (preDeps === null) {
    return false;
  }
  for (let i = 0; i < preDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], preDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

function mountEffect(create, deps) {
  return mountEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  //给当前的函数组件fiber添加flags
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, undefined, nextDeps);
}
/**
 * 添加effect链表
 * @param {*} tag effect的标签
 * @param {*} create 创建方法
 * @param {*} destory 销毁方法
 * @param {*} deps 依赖数组
 */
function pushEffect(tag, create, destory, deps) {
  const effect = {
    tag,
    create,
    destory,
    deps,
    next: null
  };
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}

function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null
  };
}

//useState其实就是内置了reducer的useReducer
function baseStateReducer(state, action) {
  return typeof action === "function" ? action(state) : action;
}
function updateState() {
  return updateReducer(baseStateReducer);
}
function mountState(initialState) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialState;
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: baseStateReducer, //上一个reducer
    lastRenderedState: initialState //上一个state
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue));
  return [hook.memoizedState, dispatch];
}

function dispatchSetState(fiber, queue, action) {
  const update = {
    action,
    eagerState: null, //急切的更新状态
    hasEagerState: false, //是否有急切的更新
    next: null
  };
  //当你派发动作后，立马用上一次的状态和上一次的reducer计算新的状态
  const { lastRenderedReducer, lastRenderedState } = queue;
  const eagerState = lastRenderedReducer(lastRenderedState, action);
  update.hasEagerState = true;
  update.eagerState = eagerState;
  if (Object.is(eagerState, lastRenderedState)) {
    return;
  }
  //入队更新 并调度更新逻辑
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root);
}
/**
 *
 * @returns 更新构建新的hook
 */
function updateWorkInProgressHook() {
  //获取将要构建的新的hook的老hook
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    currentHook = current.memoizedState;
  } else {
    currentHook = currentHook.next;
  }
  //根据老Hook创建新的hook
  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null
  };
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  return workInProgressHook;
}

//更新Reducer的方法
function updateReducer(reducer) {
  //获取新的hook
  const hook = updateWorkInProgressHook();
  //获取新的hook的更新队列
  const queue = hook.queue;
  //获取老的Hook
  const current = currentHook;
  //获取将要生效的更新队列
  const pendingQueue = queue.pending;
  //初始化一个新的状态，赋值为当前的状态
  let newState = current.memoizedState;
  if (pendingQueue !== null) {
    queue.pending = null;
    const firstUpdate = pendingQueue.next; //循环链表的最后一个的next就是第一个
    let update = firstUpdate;
    do {
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== null && update !== firstUpdate);
  }
  hook.memoizedState = newState;
  return [hook.memoizedState, queue.dispatch];
}

function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialArg;
  const queue = {
    pending: null, //queue.pending = update更新的循环链表
    dispatch: null
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue));
  return [hook.memoizedState, dispatch];
}

/**
 * 执行派发动作的方法，更新状态，并让页面更新
 * @param {*} fiber function对应的fiber
 * @param {*} queue hook对应的更新队列
 * @param {*} action 派发的动作
 */
function dispatchReducerAction(fiber, queue, action) {
  const update = {
    action, //{type: 'add', payload: 1}
    next: null
  };
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root);
}

/**
 * 挂在构建中的hook
 */
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null, //hook的状态 0
    queue: null, //存放本Hook的更新队列 queue.pending = update循环链表
    next: null //指向下一个Hook,一个函数里可以有多个Hook，它们会组成一个单向链表
  };
  if (workInProgressHook === null) {
    //当前函数对应的Fiber的状态等于第一个hook对象
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}

/**
 * 渲染函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM/React元素
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  //Function组件对应的fiber
  currentlyRenderingFiber = workInProgress;
  workInProgress.updateQueue = null;
  workInProgress.memoizedState = null;
  //如果有老的fiber和老的hook链表
  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  }
  const children = Component(props);
  currentHook = null;
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  return children;
}
