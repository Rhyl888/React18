import { HostComponent, HostRoot, HostText, IndeterminateComponent } from "./ReactWorkTags";
import { NoFlags } from "./ReactFiberFlags";
/**
 *
 * @param {*} tag fiber的类型 函数组件0 类组件1 原生组件5 根元素3
 * @param {*} pendingProps 新属性， 等待处理或者说生效的属性
 * @param {*} key 唯一标识
 */
export function FiberNode(tag, pendingProps, key) {
  this.tag = tag;
  this.key = key;
  this.type = null;
  //每个虚拟DOM => Fiber => 真实DOM
  this.stateNode = null; //stateNode对应（指向）真实DOM

  this.return = null; //指向父节点
  this.child = null; //指向第一个子节点
  this.sibling = null; //指向弟弟

  this.pendingProps = pendingProps; //等待生效的属性
  this.memoizedProps = null; //已经生效的属性

  //每个fiber都有自己的状态，状态存的类型不一样
  //比如类组件对应的fiber 存的就是类的实例，
  //hostFiber存的就是要渲染的元素
  this.memoizedState = null;
  //每个fiber可能还有更新队列
  this.updateQueue = null;
  //副作用标识
  this.flags = NoFlags;
  //子节点对应的副作用（增删改）标识
  this.subtreeFlags = NoFlags;
  //轮替, DOM-DIFF比较的时候用
  this.alternate = null;
  //在子节点中排序的位置
  this.index = 0;
  this.deletions = null; //存放将要删除的fiber
}

export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key);
}

export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}

/**
 * 基于老的fiber和新的属性创建新的fiber
 * @param {*} current 老fiber
 * @param {*} pendingProps 新属性
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  return workInProgress;
}

/**
 * 根据虚拟DOM创建fiber节点
 * @param {*} elemnt
 */
export function createFiberFromElement(elemnt) {
  const { type, key } = elemnt;
  const pendingProps = elemnt.props;
  return createFiberFromTypeAndProps(type, key, pendingProps);
}

function createFiberFromTypeAndProps(type, key, pendingProps) {
  let tag = IndeterminateComponent;
  //如果类型是一个字符串 span div 说明此fiber类型是一个原生组件
  if (typeof type === "string") {
    tag = HostComponent;
  }
  const fiber = createFiber(tag, pendingProps, key);
  fiber.type = type;
  return fiber;
}

export function createFiberFromText(content) {
  return createFiber(HostText, content, null);
}
