export function chunk<T>(array: T[], size: number): T[][] {
  const results: T[][] = []

  for (let x = 0; x < Math.ceil(array.length / size); x++) {
    const start = x * size
    const end = start + size

    results.push(array.slice(start, end))
  }

  return results
}

export function zip<T, U>(first: T[], second: U[]): Array<[T, U]> {
  const length = Math.min(first.length, second.length)
  const result: Array<[T, U]> = Array.from({ length })

  for (let idx = 0; idx < length; idx++) {
    result[idx] = [first[idx], second[idx]]
  }

  return result
}
