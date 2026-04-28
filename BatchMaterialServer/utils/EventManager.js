class EventManager {
  constructor() {
    this.events = {}; // 存储事件和监听器的映射
  }

  // 注册事件监听器
  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }

  // 触发事件
  emit(event, ...args) {
    const listeners = this.events[event];
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  // 移除事件监听器
  off(event, listener) {
    const listeners = this.events[event];
    if (listeners) {
      this.events[event] = listeners.filter(l => l !== listener);
    }
  }
}

module.exports = new EventManager();
