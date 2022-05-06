export function chunk<T>(array: T[], size: number): T[][] {
  const results: T[][] = []

  for (let x = 0; x < Math.ceil(array.length / size); x++) {
    const start = x * size
    const end = start + size

    results.push(array.slice(start, end))
  }

  return results
}

// eslint-disable-next-line @typescript-eslint/ban-types
type RecursivelyReplaceNullWithUndefined<T> = T extends null
  ? undefined
  : T extends Date
  ? T
  : {
      [K in keyof T]: T[K] extends Array<infer U>
        ? Array<RecursivelyReplaceNullWithUndefined<U>>
        : RecursivelyReplaceNullWithUndefined<T[K]>
    }

export function nullsToUndefined<T>(
  object: T
): RecursivelyReplaceNullWithUndefined<T> {
  if (object === null) {
    return undefined as RecursivelyReplaceNullWithUndefined<T>
  }

  // @ts-expect-error Object Check
  if (object.constructor.name === 'Object') {
    for (const key of Object.keys(object)) {
      // @ts-expect-error Generic Object
      object[key] = nullsToUndefined(object[key]) as unknown
    }
  }

  return object as RecursivelyReplaceNullWithUndefined<T>
}
