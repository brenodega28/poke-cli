import type { BaseParser } from "./base";
import { Gen4Parser } from "./gen4/parser";

export function getParser(save: Uint8Array): BaseParser{
    return new Gen4Parser(save);
}