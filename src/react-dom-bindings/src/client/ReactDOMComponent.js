import { setValueForStyles } from "./CSSPropertyOperations";
import setTextContent from "./setTextContent";
import { setValueForProperty } from "./DOMPropertyOperations";

const STYLE = "style";
const CHILDREN = "children";
function setInitialDOMProperties(tag, domElemnt, nextProps) {
  for (const propKey in nextProps) {
    if (nextProps.hasOwnProperty(propKey)) {
      const nextProp = nextProps[propKey];
      if (propKey === STYLE) {
        setValueForStyles(domElemnt, nextProp);
      } else if (propKey == CHILDREN) {
        if (typeof nextProp === "string") {
          setTextContent(domElemnt, nextProp);
        } else if (typeof nextProp === "number") {
          setTextContent(domElemnt, `${nextProp}`);
        }
      } else if (nextProp !== null) {
        setValueForProperty(domElemnt, propKey, nextProp);
      }
    }
  }
}

export function setInitialProperties(domElemnt, tag, props) {
  setInitialDOMProperties(tag, domElemnt, props);
}
