import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from "./ReactFiber";
import { Placement, ChildDeletion } from "./ReactFiberFlags";
import isArray from "shared/isArray";
import { HostTetx } from "./ReactWorkTags";

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
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) return;
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childToDelete);
    }
  }
  //删除从currentFirstChild之后所有的fiber节点
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) return;
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
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
      if (child.key === key) {
        //判断老fiber对应的类型和新虚拟DOM对象对应的类型是否相同
        if (child.type === element.type) {
          deleteRemainingChildren(returnFiber, child.sibling);
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        } else {
          //如果找到以key一样的老fiber 但是类型不一样，，不能复用此老fiber，把剩下的全部删除
          deleteRemainingChildren(returnFiber, child);
        }
      } else {
        deleteChild(returnFiber, child);
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
    if ((typeof newChild === "string" && newChild !== "") || typeof newChild === "number") {
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

  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    //指定新的 fiber在新的位置中的挂载索引
    newFiber.index = newIndex;
    //如果不需要跟踪副作用
    if (!shouldTrackSideEffects) {
      return lastPlacedIndex;
    }
    //获取它的老fiber
    const current = newFiber.alternate;
    //如果有，说明是一个更新的节点， 有老的真实DOM
    if (current !== null) {
      const oldIndex = current.index;
      //如果找到的老fiber的索引比lastPlacedIndex 小，则老fiber对应的DOM节点需要移动
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        return oldIndex;
      }
    } else {
      //如果没有，说明是一个新的节点，需要插入
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
  }
  function updateElement(returnFiber, current, element) {
    const elementType = element.type;
    if (current !== null) {
      //判断是否类型一样，则表示key 和 type都一样
      if (current.type === elementType) {
        const existiing = useFiber(current, element.props);
        existiing.return = returnFiber;
        return existiing;
      }
    }
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null;
    if (typeof newChild !== null && typeof newChild === "object") {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          //如果KEY一样就进入更新逻辑
          if (newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild);
          } else {
            return null;
          }
        }
        default:
          break;
      }
    }
  }

  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const exitingChildren = new Map();
    let exitingChild = currentFirstChild;
    while (exitingChild !== null) {
      //如果有key用key ，没有key用索引
      if (exitingChild.key !== null) {
        exitingChildren.set(exitingChild.key, exitingChild);
      } else {
        exitingChildren.set(exitingChild.index, exitingChild);
      }
      exitingChild = exitingChild.sibling;
    }
    return exitingChildren;
  }

  function updateTextNode(exitingChildren, returnFiber, newIndex, newChild) {
    if (current === null || current.tag !== HostTetx) {
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    } else {
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateFromMap(exitingChildren, returnFiber, newIndex, newChild) {
    if ((typeof newChild === "string" && newChild !== "") || typeof newChild === "number") {
      const matchedFiber = exitingChildren.get(newIndex) || null;
      return updateTextNode(returnFiber, matchedFiber, "" + newChild);
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const matchedFiber = exitingChildren.get(newChild.key === null ? newIndex : newChild.key) || null;
          return updateElement(returnFiber, matchedFiber, newChild);
        }
      }
    }
  }

  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null; //返回的第一个新儿子
    let previousNewFiber = null; //上一个的新儿子fiber
    let newIndex = 0; //用来遍历新的虚拟DOM的索引
    let oldFiber = currentFirstChild; //第一个老fiber
    let nextOldFiber = null; // 下一个老fiber
    let lastPlacedIndex = 0; //上一个不需要移动的老节点的索引
    //开始第一轮循环
    for (; oldFiber !== null && newIndex < newChildren.length; newIndex++) {
      //先暂存下一个老fiber
      nextOldFiber = oldFiber.sibling;
      //试图更新或者试图复用老的fiber
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIndex]);
      if (newFiber === null) {
        break;
      }
      if (shouldTrackSideEffects) {
        //如果有老fiber，但是新的fiber并没有成功复用老fiber和老的真实DOM，那就删除老fiber，在提交阶段会删除真实DOM
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      //指定新fiber的位置
      placeChild(newFiber, lastPlacedIndex, newIndex);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      //新的节点移动
      previousNewFiber = newFiber;
      //老节点也移动
      oldFiber = nextOldFiber;
    }
    //第二轮遍历
    //新的虚拟DOM已经循环完毕
    if (newIndex === newChildren.length) {
      //删除剩下的老fiber
      deleteRemainingChildren(returnFiber, oldFiber);
      return;
    }
    if (oldFiber === null) {
      //如果老的fiber已经没有了，新的虚拟DOM还有，就进入插入新节点的逻辑
      for (; newIndex < newChildren.length; newIndex++) {
        const newFiber = createChild(returnFiber, newChildren[newIndex]);
        if (newFiber === null) continue;
        placeChild(newFiber, lastPlacedIndex, newIndex);
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
    }
    // 开始处理移动的情况
    const exitingChildren = mapRemainingChildren(returnFiber, oldFiber);
    // 开始遍历剩下的虚拟DOM子节点
    for (; newIndex < newChildren.length; newIndex++) {
      const newFiber = updateFromMap(exitingChildren, returnFiber, newIndex, newChildren[newIndex]);
      if (newFiber !== null) {
        //如果要跟踪副作用，并且有老fiber
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
            exitingChildren.delete(newFiber.key === null ? newIndex : newFiber.key);
          }
        }
        //指定新的fiber的存放位置，并且给lastPlacedIndex赋值
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);
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
    }
    if (shouldTrackSideEffects) {
      //等全部处理完成后，删除map中所有剩下的老fiber
      exitingChildren.forEach((child) => deleteChild(returnFiber, child));
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
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild));
        default:
          break;
      }
    }
    //newChild [hello文本节点，span虚拟DOM元素] 新节点有多个
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
