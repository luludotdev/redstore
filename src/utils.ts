type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>

export function chunk<T, N extends number>(array: T[], size: N): Tuple<T, N>[] {
  const results: T[][] = []

  for (let x = 0; x < Math.ceil(array.length / size); x++) {
    const start = x * size
    const end = start + size

    results.push(array.slice(start, end))
  }

  return results as Tuple<T, N>[]
}

// eslint-disable-next-line @typescript-eslint/ban-types
type RecursivelyReplaceNullWithUndefined<T> = T extends null
  ? undefined
  : T extends Date
  ? T
  : {
      [K in keyof T]: T[K] extends (infer U)[]
        ? RecursivelyReplaceNullWithUndefined<U>[]
        : RecursivelyReplaceNullWithUndefined<T[K]>
    }

export function nullsToUndefined<T>(
  object: T,
): RecursivelyReplaceNullWithUndefined<T> {
  if (object === null || object === undefined) {
    return undefined as RecursivelyReplaceNullWithUndefined<T>
  }

  if (object.constructor.name === 'Object') {
    for (const key of Object.keys(object)) {
      // @ts-expect-error Generic Object
      object[key] = nullsToUndefined(object[key]) as unknown
    }
  }

  return object as RecursivelyReplaceNullWithUndefined<T>
}
