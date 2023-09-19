import hasOwnProperty from "shared/hasOwnProperty";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
const RESERVED_PROPS = {
  key: true,
  ref: true,
  _self: true,
  _source: true,
};

function hasValidRef(config) {
  return config.ref !== undefined;
}

function ReactElement(type, key, ref, props) {
  //虚拟DOM 也就是React元素
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
  };
}

export function jsxDEV(type, config, maybeKey) {
  let propName; // 属性名
  const props = {}; // 属性对象
  let key = null; //唯一标识
  let ref = null; //引用，真实DOM的实例
  if (typeof maybeKey !== "undefined") {
    key = maybeKey;
  }
  if (hasValidRef(config)) {
    ref = config.ref;
  }

  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }
  return ReactElement(type, key, ref, props);
}
