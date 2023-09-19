import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";
import isArray from "shared/isArray";
/**
 *
 * @param {*} shouldTrackSideEffects 是否跟踪副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }
  /**
   *
   * @param {*} returnFiber 根fiber div#root对应的fiber
   * @param {*} currentFirstChild 老的FunctionComponent 对应的fiber
   * @param {*} element 新的虚拟DOM对象
   * @returns 返回新的第一个子fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    //新的虚拟DOM的key,唯一标识
    const key = element.key; //null
    let child = currentFirstChild; //老的FunctionComponent对应的fiber
    while (child !== null) {
      //判断此老fiber对应的key和新虚拟DOM对象对应的Key是否相同
      if (child.key === element.key) {
        //判断老fiber对应的类型和新虚拟DOM对象对应的类型是否相同
        if (child.type === element.type) {
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        }
      }
      child = child.sibling;
    }

    //第一次挂载 老节点currentFirstChild肯定是没有的（根fiber HostRoot）没有子fiber，就直接创建
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  /**
   * 设置副作用
   * @param {*} newFiber
   */
  function placeSingleChild(newFiber) {
    //说明要添加副作用
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number"
    ) {
      const created = createFiberFromText(`${newChild}`);
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        }
        default:
          break;
      }
    }
    return null;
  }

  function placeChild(newFiber, newIndex) {
    newFiber.index = newIndex;
    if (shouldTrackSideEffects) {
      //flags 为 Placement;说明子节点需要创建真实DOM并添加到父容器中
      newFiber.flags |= Placement;
    }
  }

  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null; //返回的第一个新儿子
    let previousNewFiber = null; //上一个的新fiber
    let newIndex = 0;
    for (; newIndex < newChildren.length; newIndex++) {
      const newFiber = createChild(returnFiber, newChildren[newIndex]);
      if (newFiber === null) continue;
      placeChild(newFiber, newIndex);
      //如果previousNewFiber为null 说明是第一个fiber
      if (previousNewFiber === null) {
        //这个newFiber就是大儿子
        resultingFirstChild = newFiber;
      } else {
        //不是大儿子 就把这个newFiber 添加到上一个子节点后面
        previousNewFiber.sibling = newFiber;
      }
      //让newFiber成功上一个子fiber 或者说是最后一个子fiber
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }

  /**
   * 比较子Fiber 老的子fiber链表和新的子虚拟DOM进行比较的过程
   * @param {*} returnFiber 新的父fiber
   * @param {*} currentFirstChild 老fiber的第一个子fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstChild, newChild)
          );
        default:
          break;
      }
    }
    //newChild [hello文本节点，span虚拟DOM元素]
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
    }
    return null;
  }
  return reconcileChildFibers;
}

//有老fiber更新的时候
export const reconcileChildFibers = createChildReconciler(true);
//如果没有老父fiber ，初次挂载用这个
export const mountChildFibers = createChildReconciler(false);
