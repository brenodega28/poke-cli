import { readFileSync } from "node:fs";
import { getParser } from "../parsers/decider";

export function getEmptyBoxSlot(path: string){
    const parser = getParser(readFileSync(path));
    
    console.log(parser.getEmptyBoxSlot());
}