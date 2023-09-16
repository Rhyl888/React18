import logger from "shared/logger";
import {
  HostComponent,
  HostRoot,
  HostTetx,
  FunctionComponent,
  IndeterminateComponent,
} from "./ReactWorkTags";
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { shouldSetTextContent } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { renderWithHooks } from "react-reconciler/src/ReactFiberHooks";

/**
 * 根据新的虚拟DOM生成新的Fiber链表
 * @param {*} current 老的父fiber
 * @param {*} workInProgress  新的子Fiber
 * @param {*} nextChidren 新的子虚拟DOM
 */
function reconcileChildren(current, workInProgress, nextChidren) {
  //如果此新fiber没有老fiber， 说明此新fiber是新创建的
  if (current === null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChidren);
  } else {
    //如果有老fiber,进行DOM-DIFF 拿老的fiber和新的子虚拟DOM进行比较，进行最小化更新
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChidren
    );
  }
}

function updateHostRoot(current, workInProgress) {
  //需要知道它的子虚拟DOM的信息
  processUpdateQueue(workInProgress);
  const nextState = workInProgress.memoizedState;
  //nextChildren就是新的子虚拟DOM
  const nextChildren = nextState.element;
  //协调子节点 DOM-DIFF算法
  //根据新的虚拟DOM生成子fiber链表
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child; //{tag: 5, type: 'h1'}
}

function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress;
  const nextProps = workInProgress.pendingProps;
  //nextChildren就是新的子虚拟DOM
  let nextChildren = nextProps.children;
  //判断当前虚拟DOM的儿子是不是一个文本独生子
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    nextChildren = null;
  }
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}
/**
 *
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的fiber
 * @param {*} type 组件类型 => 函数组件的定义
 */

function mountIndeterminateComponent(current, workInProgress, Component) {
  const props = workInProgress.pendingProps;
  // const value = Component(props);
  const value = renderWithHooks(current, workInProgress, Component, props);
  workInProgress.tag = FunctionComponent;
  reconcileChildren(current, workInProgress, value);
  return workInProgress.child;
}

/**
 *根据新虚拟DOM 构建 新的fiber子链表 child 和sibling
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的fiber
 * brucefe/bruce_nodejs_project_template
 */
export function beginWork(current, workInProgress) {
  logger("beginWork", workInProgress);
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type
      );

    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostTetx:
      return null;
    default:
      return null;
  }
}
