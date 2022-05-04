export function chunk<T>(array: T[], size: number): T[][] {
  const results: T[][] = []

  for (let x = 0; x < Math.ceil(array.length / size); x++) {
    const start = x * size
    const end = start + size

    results.push(array.slice(start, end))
  }

  return results
}
