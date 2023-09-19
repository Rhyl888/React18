import logger, { indent } from "shared/logger";
import {
  createTextInstance,
  createInstance,
  appendInitialChild,
  finalizeInitialChildren,
  prepareUpdate,
} from "react-dom-bindings/src/client/ReactDOMHostConfig";
import {
  HostComponent,
  HostTetx,
  HostRoot,
  FunctionComponent,
} from "./ReactWorkTags";
import { NoFlags, Update } from "./ReactFiberFlags";

/**
 * 把当前完成的fiber其所有的子节点对应的真实DOM都挂在到自己父parent的真实DOM节点上
 * @param {*} parent 当前完成的fiber对应的父DOM节点
 * @param {*} workInProgress 完成的fiber
 */
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child;
  while (node) {
    //如果子节点类型是一个原生节点或者一个文本节点
    if (node.tag === HostComponent || node.tag === HostTetx) {
      appendInitialChild(parent, node.stateNode);
      //如果第一个儿子不是一个原生或者文本节点，说明它可能是一个函数组件
    } else if (node.child !== null) {
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
    //如果当前的节点没有弟弟
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      //回到父节点
      node = node.return;
    }
    node = node.sibling;
  }
}

function markUpdate(workInProgress) {
  workInProgress.flags |= Update;
}

/**
 * 在fiber的完成阶段准备更新DOM 比如button
 * @param {*} current button老fiber
 * @param {*} workInProgress button的新fiber
 * @param {*} type 类型
 * @param {*} newProps 新属性
 */
function updateHostComponent(current, workInProgress, type, newProps) {
  const oldProps = current.memoizedProps; //老的属性
  const instance = workInProgress.stateNode; //老的DOM节点
  //比较新老属性，收集属性的差异
  const updatePayload = prepareUpdate(instance, type, oldProps, newProps);
  //让原生组件的新fiber更新队列等于 【】
  workInProgress.updateQueue = updatePayload;
  console.log("updatePayload", updatePayload);
  if (updatePayload) {
    markUpdate(workInProgress);
  }
}

/**
 * 完成一个fiber节点
 * @param {*} current 老fiber
 * @param {*} workInProgress 新构建的fiber
 */
export function completeWork(current, workInProgress) {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case HostRoot:
      bubbleProperties(workInProgress);
      break;
    //完成的是原生节点;
    case HostComponent:
      const { type } = workInProgress;
      //如果老fiber存在，并且老fiber对应的真实DOM节点也存在，就走更新逻辑
      if (current !== null && workInProgress.stateNode !== null) {
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        const instance = createInstance(type, newProps, workInProgress);
        workInProgress.stateNode = instance;
        //把自己的所有的儿子都添加到自己的身上
        appendAllChildren(instance, workInProgress);
        finalizeInitialChildren(instance, type, newProps);
      }

      bubbleProperties(workInProgress);
      break;
    case FunctionComponent:
      bubbleProperties(workInProgress);
      break;
    case HostTetx:
      //完成的fiber是文本节点，就直接创建真实的DOM
      const newText = newProps;
      workInProgress.stateNode = createTextInstance(newText);
      bubbleProperties(workInProgress);
      break;
  }
}

function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags;
  //遍历当前fiber的所有子节点
  let child = completedWork.child;
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  completedWork.subtreeFlags = subtreeFlags;
}
