import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "bun:test";
import { Gen4Parser } from "../../src/parsers/gen4/parser";
const parser = new Gen4Parser("./saves/heartgold.sav");

test("It correctly gets empty box slot", () =>{
    expect(parser.getEmptyBoxSlot()).toEqual([16, 20])
})

test("It correctly gets first party pokemon", () =>{
    const party = parser.readParty();
    expect(party[0]).toEqual({
        generation: 4,
        speciesId: 493,
        nickname: "ARCEUS",
        experience: 1250000,
        heldItemId: 251,
        friendship: 255,
        pokerus: 16,
        ot: {
            name: "?????",
            trainerId: 46415,
            secretId: 33903,
            gender: "female",
        },
        personalityValue: 543755078,
        natureId: 3,
        gender: "genderless",
        isShiny: false,
        abilitySlot: 0,
        abilityId: 121,
        ivs: { hp: 31, attack: 31, defense: 31, speed: 30, specialAttack: 30, specialDefense: 31 },
        evs: { hp: 252, attack: 252, defense: 0, speed: 6, specialAttack: 0, specialDefense: 0 },
        contest: {
            coolness: 255,
            beauty: 0,
            cuteness: 255,
            smartness: 0,
            toughness: 255,
            feel: 255,
        },
        moves: [
            { moveId: 245, pp: 16, ppUps: 3 },
            { moveId: 14, pp: 16, ppUps: 0 },
            { moveId: 89, pp: 16, ppUps: 0 },
            { moveId: 421, pp: 16, ppUps: 0 },
        ],
        met: { locationId: 86, levelMet: 100, originGameId: 1, ballId: 4 },
        hiddenPower: { typeId: 9, power: 70 },
        ribbons: 115712,
        markings: {
            circle: false,
            triangle: false,
            square: false,
            heart: false,
            star: false,
            diamond: false,
        },
        isEgg: false,
        isNicknamed: false,
        languageId: 2,
        formId: 0,
        status: {
            sleepTurns: 0,
            poison: false,
            burn: false,
            freeze: false,
            paralysis: false,
            badlyPoisoned: false,
        },
        level: 100,
        currentHp: 404,
        stats: {
            hp: 404,
            attack: 257,
            defense: 306,
            speed: 138,
            specialAttack: 206,
            specialDefense: 216,
        },
    })
})

test("It correctly gets last party pokemon", () =>{
    const party = parser.readParty();
    expect(party.at(-1)).toEqual({
        generation: 4,
        speciesId: 493,
        nickname: "ARCEUS",
        experience: 1250000,
        heldItemId: 298,
        friendship: 255,
        pokerus: 16,
        ot: {
            name: "?????",
            trainerId: 46415,
            secretId: 33903,
            gender: "female",
        },
        personalityValue: 346760590,
        natureId: 15,
        gender: "genderless",
        isShiny: true,
        abilitySlot: 0,
        abilityId: 121,
        ivs: { hp: 31, attack: 31, defense: 31, speed: 31, specialAttack: 31, specialDefense: 31 },
        evs: { hp: 0, attack: 0, defense: 0, speed: 0, specialAttack: 0, specialDefense: 0 },
        contest: {
            coolness: 0,
            beauty: 0,
            cuteness: 0,
            smartness: 0,
            toughness: 0,
            feel: 0,
        },
        moves: [
            { moveId: 70, pp: 16, ppUps: 3 },
            { moveId: 15, pp: 16, ppUps: 0 },
            { moveId: 19, pp: 16, ppUps: 0 },
            { moveId: 431, pp: 16, ppUps: 0 },
        ],
        met: { locationId: 86, levelMet: 100, originGameId: 12, ballId: 4 },
        hiddenPower: { typeId: 15, power: 70 },
        ribbons: 115712,
        markings: {
            circle: false,
            triangle: false,
            square: false,
            heart: false,
            star: false,
            diamond: false,
        },
        isEgg: false,
        isNicknamed: false,
        languageId: 2,
        formId: 0,
        status: {
            sleepTurns: 0,
            poison: false,
            burn: false,
            freeze: false,
            paralysis: false,
            badlyPoisoned: false,
        },
        level: 100,
        currentHp: 404,
        stats: {
            hp: 404,
            attack: 257,
            defense: 306,
            speed: 138,
            specialAttack: 206,
            specialDefense: 216,
        },
    })
})

test("It correctly gets the first pokemon at the first box", () =>{
    const box = parser.readBox(0);
    expect(box[0]).toEqual({
        generation: 4,
        speciesId: 3,
        nickname: "VENUSAUR",
        experience: 117360,
        heldItemId: 0,
        friendship: 255,
        pokerus: 0,
        ot: {
            name: "?????",
            trainerId: 46415,
            secretId: 33903,
            gender: "female",
        },
        personalityValue: 4136266230,
        natureId: 5,
        gender: "male",
        isShiny: false,
        abilitySlot: 0,
        abilityId: 65,
        ivs: { hp: 31, attack: 30, defense: 30, speed: 31, specialAttack: 31, specialDefense: 31 },
        evs: { hp: 252, attack: 0, defense: 0, speed: 6, specialAttack: 0, specialDefense: 252 },
        contest: {
            coolness: 0,
            beauty: 0,
            cuteness: 0,
            smartness: 0,
            toughness: 0,
            feel: 0,
        },
        moves: [
            { moveId: 412, pp: 16, ppUps: 3 },
            { moveId: 73, pp: 16, ppUps: 0 },
            { moveId: 79, pp: 24, ppUps: 0 },
            { moveId: 188, pp: 16, ppUps: 0 },
        ],
        met: { locationId: 3002, levelMet: 0, originGameId: 7, ballId: 4 },
        hiddenPower: { typeId: 13, power: 70 },
        ribbons: 0,
        markings: {
            circle: false,
            triangle: false,
            square: false,
            heart: false,
            star: false,
            diamond: false,
        },
        isEgg: false,
        isNicknamed: false,
        languageId: 1,
        formId: 0,
        eggMet: { locationId: 3002, levelMet: 0, originGameId: 7, ballId: 0 },
    })
})

test("It correctly gets the last pokemon in a box", () =>{
    const box = parser.readBox(0);
    expect(box.at(-1)).toEqual({
        generation: 4,
        speciesId: 36,
        nickname: "CLEFABLE",
        experience: 100000,
        heldItemId: 0,
        friendship: 255,
        pokerus: 0,
        ot: {
            name: "?????",
            trainerId: 46415,
            secretId: 33903,
            gender: "female",
        },
        personalityValue: 2753729795,
        natureId: 20,
        gender: "female",
        isShiny: true,
        abilitySlot: 1,
        abilityId: 98,
        ivs: { hp: 31, attack: 31, defense: 31, speed: 31, specialAttack: 31, specialDefense: 31 },
        evs: { hp: 252, attack: 0, defense: 152, speed: 4, specialAttack: 0, specialDefense: 100 },
        contest: {
            coolness: 0,
            beauty: 0,
            cuteness: 0,
            smartness: 0,
            toughness: 0,
            feel: 0,
        },
        moves: [
            { moveId: 86, pp: 32, ppUps: 3 },
            { moveId: 227, pp: 8, ppUps: 0 },
            { moveId: 273, pp: 16, ppUps: 0 },
            { moveId: 69, pp: 32, ppUps: 0 },
        ],
        met: { locationId: 3002, levelMet: 0, originGameId: 7, ballId: 4 },
        hiddenPower: { typeId: 15, power: 70 },
        ribbons: 0,
        markings: {
            circle: false,
            triangle: false,
            square: false,
            heart: false,
            star: false,
            diamond: false,
        },
        isEgg: false,
        isNicknamed: false,
        languageId: 1,
        formId: 0,
        eggMet: { locationId: 3002, levelMet: 0, originGameId: 7, ballId: 0 },
    })
})

test("It correctly gets the last pokemon in the last box", () =>{
    const box = parser.readBox(17);
    expect(box.at(-1)).toEqual({
        generation: 4,
        speciesId: 493,
        nickname: "?????",
        experience: 1250000,
        heldItemId: 212,
        friendship: 0,
        pokerus: 0,
        ot: {
            name: "?????",
            trainerId: 7189,
            secretId: 2831,
            gender: "male",
        },
        personalityValue: 4195445867,
        natureId: 17,
        gender: "genderless",
        isShiny: false,
        abilitySlot: 1,
        abilityId: 121,
        ivs: { hp: 7, attack: 15, defense: 22, speed: 18, specialAttack: 18, specialDefense: 5 },
        evs: { hp: 0, attack: 0, defense: 0, speed: 0, specialAttack: 0, specialDefense: 0 },
        contest: {
            coolness: 0,
            beauty: 0,
            cuteness: 0,
            smartness: 0,
            toughness: 0,
            feel: 0,
        },
        moves: [
            { moveId: 449, pp: 10, ppUps: 0 },
            { moveId: 459, pp: 5, ppUps: 0 },
            { moveId: 460, pp: 5, ppUps: 0 },
            { moveId: 467, pp: 5, ppUps: 0 },
        ],
        met: { locationId: 3007, levelMet: 100, originGameId: 10, ballId: 16 },
        hiddenPower: { typeId: 8, power: 49 },
        ribbons: 67108864,
        markings: {
            circle: false,
            triangle: false,
            square: false,
            heart: false,
            star: false,
            diamond: false,
        },
        isEgg: false,
        isNicknamed: false,
        languageId: 1,
        formId: 0,
    })
})

test("It correctly writes pokemon to the nearest empty box", () =>{
    const pokemon = parser.readParty()[0];
    expect(pokemon).toBeDefined();
    if (!pokemon) return;

    const [boxID, slot] = parser.getEmptyBoxSlot();
    const outFile = join(tmpdir(), "poke-cli.heartgold.write.sav");
    parser.writePokemonToBoxSlot(pokemon, [boxID, slot], outFile);

    const written = new Gen4Parser(outFile).readBox(boxID)[slot];

    // A boxed Pokémon drops the party-only fields, so re-attach them to compare.
    // The OT name truncates at the unmapped Gen 4 symbol "?????", which the
    // partial charmap cannot re-encode.
    const { status, level, currentHp, stats } = pokemon;
    expect({ ...written, status, level, currentHp, stats }).toEqual({
        ...pokemon,
        ot: { ...pokemon.ot, name: "" },
    })

    rmSync(outFile, { force: true });
})

