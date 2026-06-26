import {test, expect} from "bun:test"
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync, rmSync } from "node:fs";
import { getParser } from "../../src/parsers/decider";
import { evolvePokemon } from "../../src/actions/evolve-pokemon";

test("It evolves gen 4 pokemon", async () =>{
    const path = "./saves/platinum.sav"
    const outFile = join(tmpdir(), "poke-cli.platinum.clone.sav");

    await evolvePokemon(path, {box:"0,0", out: outFile})
    const destinationParser = getParser(readFileSync(outFile))

    expect(destinationParser.readBox(0)[0]?.speciesId).toBe(388)
    rmSync(outFile, { force: true });
})