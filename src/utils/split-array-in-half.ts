export function splitArrayInHalf<T>(arr: T[]): [T[], T[]] {
  const index = Math.ceil(arr.length / 2)
  const arr1 = arr.slice(0, index)
  const arr2 = arr.slice(index)
  return [arr1, arr2]
}
