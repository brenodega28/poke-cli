import { getParser } from "../parsers/decider";

export function getEmptyBoxSlot(path: string){
    const parser = getParser(path);
    
    console.log(parser.getEmptyBoxSlot());
}