export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isEmptyObjOrNull = (obj: any) => {
  return obj == undefined || Object.keys(obj).length === 0
}