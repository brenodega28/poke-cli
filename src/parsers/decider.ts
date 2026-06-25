import type { BaseParser } from "./base";
import { Gen4Parser } from "./gen4/parser";

export function getParser(saveFilePath: string): BaseParser{
    return new Gen4Parser(saveFilePath);
}