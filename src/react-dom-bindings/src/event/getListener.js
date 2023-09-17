import { getFiberCurrentPropsFromNode } from "../client/ReactDOMComponentTree";

/**
 * 获取此fiber上对应的回调函数
 * @param {*} inst
 * @param {*} registragtionName
 */
export function getListener(inst, registragtionName) {
  const { stateNode } = inst;
  if (stateNode === null) return null;
  const props = getFiberCurrentPropsFromNode(stateNode);
  if (props === null) return null;
  const listener = props[registragtionName]; //props.onClick
  return listener;
}

export default getListener;
