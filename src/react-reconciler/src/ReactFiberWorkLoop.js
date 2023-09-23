import { scheduleCallback } from "scheduler";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { ChildDeletion, MutationMask, NoFlags, Passive, Placement, Update } from "./ReactFiberFlags";
import {
  commitMutationEffectsOnFiber, //执行DOM操作
  commitPassiveUnmountEffects, //执行destroy
  commitPassiveMountEffects //执行create
} from "./ReactFiberCommitWork";
import { finishQueueingConCurrentUpdates } from "./ReactFiberConcurrentUpdates";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";

let workInProgress = null;
let workInProgressRoot = null;
let rootDoesHavePassiveEffect = false; //此根节点上有没有useEffect类似的副作用
let rootWithPendingPassiveEffects = null; //具有useEffect副作用的根节点 FiberRootNode
/*
 * 计划更新root
 * 调度任务的功能
 * @param {*} root
 */
export function scheduleUpdateOnFiber(root) {
  //确保调度执行root上的更新
  ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root) {
  if (workInProgressRoot) return;
  workInProgressRoot = root;
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}

/**
 * 根据虚拟DOM构建fiber树，创建真实DOM节点并插入容器中
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root) {
  //第一次以同步方式渲染根节点
  //初次渲染时候 都是同步
  renderRootSync(root);
  //开始进入提交阶段，就是执行副作用（增删改），修改真实DOM
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
  workInProgressRoot = null;
}

function flushPassiveEffect() {
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects;
    //执行卸载副作用 destory
    commitPassiveUnmountEffects(root.current);
    //执行挂在副作用 create
    commitPassiveMountEffects(root, root.current);
  }
}

function commitRoot(root) {
  const { finishedWork } = root;
  if ((finishedWork.subtreeFlags & Passive) !== NoFlags || (finishedWork.flags & Passive) !== NoFlags) {
    if (!rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = true;
      scheduleCallback(flushPassiveEffect);
    }
  }
  console.log("~~~~~~~~");
  //判断子树有没有副作用
  const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffects = (finishedWork.flags & MutationMask) !== NoFlags;
  //如果自己有副作用或者子节点有副作用就进行提交DOM操作
  if (subtreeHasEffects || rootHasEffects) {
    //执行DOM操作
    commitMutationEffectsOnFiber(finishedWork, root);
    if (rootDoesHavePassiveEffect) {
      root.current = finishedWork;
      rootDoesHavePassiveEffect = false;
      rootWithPendingPassiveEffects = root;
    }
  }
  //等DOM变更后，就可以让root的current指向新的fiber 树
  root.current = finishedWork;
}

function prepareFreshStack(root) {
  //root.current 老的fiber
  workInProgress = createWorkInProgress(root.current, null);
  finishQueueingConCurrentUpdates();
}

function renderRootSync(root) {
  //开始构建fiber树
  prepareFreshStack(root);
  workLoopSync();
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

/**
 * 执行一个工作单元
 * @param {*} unitOfWork
 */
function performUnitOfWork(unitOfWork) {
  //获取新的fiber对应的老fiber
  const current = unitOfWork.alternate;
  //完成当前fiber的子fiber链表构建后
  const next = beginWork(current, unitOfWork);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    //如果没有子节点表示当前的fiber已经完成了
    completeUnitOfWork(unitOfWork);
  } else {
    //如果有子节点，就让子节点成为下一个工作单元
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    //执行此fiber的完成工作 创建对应真实DOM节点
    completeWork(current, completedWork);
    //如果有弟弟，就构建弟弟对应的fiber子链表
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }
    //如果没有弟弟，说明当前完成的是父fiber的最后一个子节点
    //所有的儿子都完成了父fiber也就完成了
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
}

function priintFinishedWork(fiber) {
  let child = fiber.child;
  while (child) {
    priintFinishedWork(child);
    child = child.sibling;
  }
  if (fiber.flags !== 0) {
    console.log(
      getFlages(fiber),
      getTag(fiber.tag),
      typeof fiber.type === "function" ? fiber.type.name : fiber.type,
      fiber.memoizedProps
    );
  }
}

function getFlages(fiber) {
  const { flags, deletions } = fiber;
  if (flags === (Placement | Update)) {
    return "移动";
  }
  if (flags === Placement) {
    return "插入";
  }
  if (flags === Update) {
    return "更新";
  }
  if ((flags & ChildDeletion) !== NoFlags) {
    return "子节点有删除" + deletions.map((fiber) => `${fiber.type}#${fiber.memoizedProps.id}`).join(",");
  }
  return flags;
}

function getTag(tag) {
  switch (tag) {
    case FunctionComponent:
      return "FunctionComponent";
    case HostRoot:
      return "HostRoot";
    case HostComponent:
      return "HostComponent";
    case HostText:
      return "HostText";
    default:
      return tag;
  }
}
