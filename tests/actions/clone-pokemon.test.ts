import { test, expect } from "bun:test"
import { readFileSync } from "node:fs";
import { clonePokemon } from "../../src/actions/clone-pokemon";
import { getParser } from "../../src/parsers/decider";

test("It clones gen 4 pokemon", () =>{
    const bytes = readFileSync("./saves/platinum.sav")
    const emptyBoxSlot = getParser(bytes).getEmptyBoxSlot()

    const result = clonePokemon(bytes, bytes, { party: "0" })

    expect(getParser(result).getEmptyBoxSlot()[1]).toBe(emptyBoxSlot[1] + 1)
})
