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
