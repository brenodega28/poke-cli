import { test, expect } from "bun:test"
import { readFileSync } from "node:fs";
import { getParser } from "../../src/parsers/decider";
import { evolvePokemon } from "../../src/actions/evolve-pokemon";

test("It evolves gen 4 pokemon", async () =>{
    const bytes = readFileSync("./saves/platinum.sav")

    const result = await evolvePokemon(bytes, { box: "0,0" })

    expect(getParser(result).readBox(0)[0]?.speciesId).toBe(388)
})
