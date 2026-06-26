import {test, expect} from "bun:test"
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync, rmSync } from "node:fs";
import { clonePokemon } from "../../src/actions/clone-pokemon";
import { getParser } from "../../src/parsers/decider";

test("It clones gen 4 pokemon", () =>{
    const path = "./saves/platinum.sav"
    const outFile = join(tmpdir(), "poke-cli.platinum.clone.sav");
    const originParser = getParser(readFileSync(path));
    const emptyBoxSlot = originParser.getEmptyBoxSlot()

    clonePokemon(path, path, {party:"0", out: outFile})
    const destinationParser = getParser(readFileSync(outFile))

    expect(destinationParser.getEmptyBoxSlot()[1]).toBe(emptyBoxSlot[1] + 1)
    rmSync(outFile, { force: true });
})