import { getParser } from "../parsers/decider";

export function getBox(path: string, boxIndexStr: string) {
  const boxIndex = parseInt(boxIndexStr);
  const parser = getParser(path);
  const box = parser.readBox(boxIndex);

  console.log(JSON.stringify(box))
}
