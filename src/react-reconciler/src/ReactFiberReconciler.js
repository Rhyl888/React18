import { createFiberRoot } from "./ReactFiberRoot";
import { createUpdate, enqueueUpdate } from "./ReactFiberClassUpdateQueue";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}

/**
 *
 * @param {*} element 虚拟DOM
 * @param {*} container  DOM容器 FiberRootNode containerInfo div#root
 */
export function updateContainer(element, container) {
  //获取当前的根fiber
  const current = container.current;
  //创建更新
  const update = createUpdate();
  //要更新的虚拟DOM
  update.payload = { element };
  //把此更新对象添加到current这个根fiber的更新队列上
  const root = enqueueUpdate(current, update);
  scheduleUpdateOnFiber(root);
}
