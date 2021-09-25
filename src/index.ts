// eslint-disable-next-line @typescript-eslint/ban-types
interface AsyncProxy<T extends {}> {
  get<K extends keyof T>(key: K): Promise<T[K]>
  set<K extends keyof T>(key: K, value: T[K]): Promise<void>
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function createStore<T extends {}>(): AsyncProxy<T> {
  const proxy: AsyncProxy<T> = {
    async get(key) {
      // TODO
      console.log('get', { key })
    },

    async set(key, value) {
      // TODO
      console.log('set', { key, value })
    },
  }

  return Object.freeze(proxy)
}
