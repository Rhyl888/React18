//实现优先队列
export function scheduleCallback(callback) {
  requestIdleCallback(callback);
}
