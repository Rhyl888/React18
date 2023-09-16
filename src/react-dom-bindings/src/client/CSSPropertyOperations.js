export function setValueForStyles(node, styles) {
  const { style } = node;
  for (const styleName in styles) {
    if (styles.hasOwnProperty(styleName)) {
      const stylesValue = styles[styleName];
      style[styleName] = stylesValue;
    }
  }
}
