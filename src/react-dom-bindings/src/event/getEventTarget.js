export default function getEventTarget(nativeEvent) {
  const target = nativeEvent.target || nativeEvent.srcElemnt || window;
  return target;
}
