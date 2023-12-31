const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = "_reactFiber$" + randomKey;
const internalPropsKey = "_reactProps$" + randomKey;

/**
 * 从真实的DOM节点上获取它对应的fiber节点
 * @param {*} targetNode
 */
export function getClosestInstanceFromNode(targetNode) {
  const targetInst = targetNode[internalInstanceKey];
  if (targetInst) {
    return targetInst;
  }
  //真实DOM上没有对应的Fiber,就返回null
  return null;
}

/**
 * 提前缓存fiber节点的实例到DOM节点上
 * @param {*} hostInst
 * @param {*} node
 */
export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}

export function updateFiberProps(node, props) {
  node[internalPropsKey] = props;
}

export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null;
}
