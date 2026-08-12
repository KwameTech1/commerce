const store = new Map<string, string>();

const localStorageShim: Storage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => {
    store.set(key, String(value));
  },
  removeItem: (key) => {
    store.delete(key);
  },
  clear: () => {
    store.clear();
  },
  key: (index) => Array.from(store.keys())[index] ?? null,
  get length() {
    return store.size;
  },
};

const target = new EventTarget();

const win = globalThis as unknown as {
  window: typeof globalThis;
  localStorage: Storage;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
  dispatchEvent: (event: Event) => boolean;
};

win.window = globalThis;
win.localStorage = localStorageShim;
win.addEventListener = target.addEventListener.bind(target);
win.removeEventListener = target.removeEventListener.bind(target);
win.dispatchEvent = target.dispatchEvent.bind(target);
