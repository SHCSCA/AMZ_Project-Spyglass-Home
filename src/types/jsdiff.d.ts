declare module 'jsdiff' {
  interface DiffPart { value: string; added?: boolean; removed?: boolean; }
  export function diffWords(oldStr: string, newStr: string): DiffPart[];
}