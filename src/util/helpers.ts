
const arrayToRegex = (arr: Array<string>) => {
  return new RegExp(arr.join("|"), 'gi').source
}

export default {
  arrayToRegex
}