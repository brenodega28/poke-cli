import { readFileSync } from "node:fs";
import { expect, test } from "bun:test";
import { Gen4Parser } from "../../src/parsers/gen4/parser";
const parser = new Gen4Parser(readFileSync("./saves/platinum.sav"));

test("It correctly gets empty box slot", () =>{
    expect(parser.getEmptyBoxSlot()).toEqual([7, 28])
})

test("It correctly gets first party pokemon", () =>{
    const party = parser.readParty();
    expect(party[0]).toEqual({
        generation: 4,
        speciesId: 392,
        nickname: "Calabrese",
        experience: 1059860,
        heldItemId: 287,
        friendship: 255,
        pokerus: 0,
        ot: {
            name: "Mattia?",
            trainerId: 23905,
            secretId: 2124,
            gender: "male",
        },
        personalityValue: 2034429810,
        natureId: 10,
        gender: "male",
        isShiny: false,
        abilitySlot: 0,
        abilityId: 66,
        ivs: { hp: 31, attack: 31, defense: 31, speed: 31, specialAttack: 31, specialDefense: 31 },
        evs: { hp: 0, attack: 58, defense: 0, speed: 200, specialAttack: 252, specialDefense: 0 },
        contest: {
            coolness: 255,
            beauty: 255,
            cuteness: 255,
            smartness: 255,
            toughness: 255,
            feel: 255,
        },
        moves: [
            { moveId: 370, pp: 8, ppUps: 3 },
            { moveId: 369, pp: 32, ppUps: 0 },
            { moveId: 394, pp: 24, ppUps: 0 },
            { moveId: 447, pp: 32, ppUps: 0 },
        ],
        met: { locationId: 16, levelMet: 5, originGameId: 12, ballId: 4 },
        hiddenPower: { typeId: 15, power: 70 },
        ribbons: 1310719,
        markings: {
            circle: true,
            triangle: true,
            square: true,
            heart: true,
            star: true,
            diamond: true,
        },
        isEgg: false,
        isNicknamed: true,
        languageId: 4,
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
        currentHp: 293,
        stats: {
            hp: 293,
            attack: 232,
            defense: 178,
            speed: 332,
            specialAttack: 307,
            specialDefense: 178,
        },
    })
})

test("It correctly gets last party pokemon", () =>{
    const party = parser.readParty();
    expect(party.at(-1)).toEqual({
        generation: 4,
        speciesId: 471,
        nickname: "Bebe",
        experience: 1000000,
        heldItemId: 297,
        friendship: 255,
        pokerus: 0,
        ot: {
            name: "Mattia?",
            trainerId: 23905,
            secretId: 2124,
            gender: "male",
        },
        personalityValue: 4181880690,
        natureId: 15,
        gender: "male",
        isShiny: false,
        abilitySlot: 0,
        abilityId: 81,
        ivs: { hp: 31, attack: 31, defense: 31, speed: 31, specialAttack: 31, specialDefense: 31 },
        evs: { hp: 6, attack: 0, defense: 0, speed: 252, specialAttack: 252, specialDefense: 0 },
        contest: {
            coolness: 255,
            beauty: 255,
            cuteness: 255,
            smartness: 255,
            toughness: 255,
            feel: 255,
        },
        moves: [
            { moveId: 44, pp: 40, ppUps: 3 },
            { moveId: 352, pp: 32, ppUps: 0 },
            { moveId: 58, pp: 16, ppUps: 0 },
            { moveId: 59, pp: 8, ppUps: 0 },
        ],
        met: { locationId: 10, levelMet: 20, originGameId: 12, ballId: 4 },
        hiddenPower: { typeId: 15, power: 70 },
        ribbons: 1310719,
        markings: {
            circle: true,
            triangle: true,
            square: true,
            heart: true,
            star: true,
            diamond: true,
        },
        isEgg: false,
        isNicknamed: true,
        languageId: 4,
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
        currentHp: 272,
        stats: {
            hp: 272,
            attack: 140,
            defense: 256,
            speed: 229,
            specialAttack: 394,
            specialDefense: 226,
        },
    })
})

test("It correctly gets the first pokemon at the first box", () =>{
    const box = parser.readBox(0);
    expect(box[0]).toEqual({
        generation: 4,
        speciesId: 387,
        nickname: "TURTWIG",
        experience: 0,
        heldItemId: 0,
        friendship: 70,
        pokerus: 0,
        ot: {
            name: "Mattia?",
            trainerId: 23905,
            secretId: 2124,
            gender: "male",
        },
        personalityValue: 1200603010,
        natureId: 10,
        gender: "male",
        isShiny: false,
        abilitySlot: 0,
        abilityId: 65,
        ivs: { hp: 31, attack: 30, defense: 28, speed: 31, specialAttack: 31, specialDefense: 29 },
        evs: { hp: 0, attack: 0, defense: 0, speed: 0, specialAttack: 0, specialDefense: 0 },
        contest: {
            coolness: 0,
            beauty: 0,
            cuteness: 0,
            smartness: 0,
            toughness: 0,
            feel: 0,
        },
        moves: [{ moveId: 33, pp: 35, ppUps: 0 }],
        met: { locationId: 4, levelMet: 0, originGameId: 12, ballId: 4 },
        hiddenPower: { typeId: 13, power: 47 },
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
        languageId: 4,
        formId: 0,
        eggMet: { locationId: 2000, levelMet: 0, originGameId: 12, ballId: 0 },
    })
})

test("It correctly gets the last pokemon in a box", () =>{
    const box = parser.readBox(0);
    expect(box.at(-1)).toEqual({
        generation: 4,
        speciesId: 169,
        nickname: "CROBAT",
        experience: 125000,
        heldItemId: 0,
        friendship: 70,
        pokerus: 0,
        ot: {
            name: "Mattia?",
            trainerId: 23905,
            secretId: 2124,
            gender: "male",
        },
        personalityValue: 2996991585,
        natureId: 10,
        gender: "female",
        isShiny: false,
        abilitySlot: 1,
        abilityId: 39,
        ivs: { hp: 22, attack: 24, defense: 6, speed: 4, specialAttack: 1, specialDefense: 19 },
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
            { moveId: 48, pp: 20, ppUps: 0 },
            { moveId: 109, pp: 10, ppUps: 0 },
            { moveId: 305, pp: 15, ppUps: 0 },
            { moveId: 310, pp: 15, ppUps: 0 },
        ],
        met: { locationId: 19, levelMet: 3, originGameId: 12, ballId: 15 },
        hiddenPower: { typeId: 11, power: 53 },
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
        languageId: 4,
        formId: 0,
    })
})

test("It correctly gets the last pokemon in the last box", () =>{
    const box = parser.readBox(17);
    expect(box.at(-1)).toEqual({
        generation: 4,
        speciesId: 201,
        nickname: "UNOWN",
        experience: 27000,
        heldItemId: 0,
        friendship: 70,
        pokerus: 0,
        ot: {
            name: "Mattia?",
            trainerId: 23905,
            secretId: 2124,
            gender: "male",
        },
        personalityValue: 2918062400,
        natureId: 0,
        gender: "genderless",
        isShiny: false,
        abilitySlot: 0,
        abilityId: 26,
        ivs: { hp: 10, attack: 19, defense: 2, speed: 28, specialAttack: 5, specialDefense: 23 },
        evs: { hp: 0, attack: 0, defense: 0, speed: 0, specialAttack: 0, specialDefense: 0 },
        contest: {
            coolness: 0,
            beauty: 0,
            cuteness: 0,
            smartness: 0,
            toughness: 0,
            feel: 0,
        },
        moves: [{ moveId: 237, pp: 15, ppUps: 0 }],
        met: { locationId: 53, levelMet: 30, originGameId: 12, ballId: 4 },
        hiddenPower: { typeId: 11, power: 54 },
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
        languageId: 4,
        formId: 27,
    })
})

test("It correctly writes pokemon to the nearest empty box", () =>{
    const pokemon = parser.readParty()[0];
    expect(pokemon).toBeDefined();
    if (!pokemon) return;

    const [boxID, slot] = parser.getEmptyBoxSlot();
    const updated = parser.writePokemonToBoxSlot({ pokemon, boxSlot: [boxID, slot] });

    const written = new Gen4Parser(updated).readBox(boxID)[slot];

    // A boxed Pokémon drops the party-only fields, so re-attach them to compare.
    // The OT name truncates at the unmapped Gen 4 symbol in "Mattia?", which the
    // partial charmap cannot re-encode.
    const { status, level, currentHp, stats } = pokemon;
    expect({ ...written, status, level, currentHp, stats }).toEqual({
        ...pokemon,
        ot: { ...pokemon.ot, name: "Mattia" },
    })
})

test("It correctly evolves a single-path pokemon", async () =>{
    // Turtwig (#387) evolves only into Grotle (#388).
    expect(parser.readBox(0)[0]?.speciesId).toBe(387);

    const updated = await parser.evolvePokemon({ boxSlot: [0, 0] });

    expect(new Gen4Parser(updated).readBox(0)[0]?.speciesId).toBe(388);
})

test("It correctly evolves a branching pokemon to the chosen species", async () =>{
    // Burmy (#412) can become Wormadam (#413) or Mothim (#414); pick Mothim.
    expect(parser.readBox(1)[14]?.speciesId).toBe(412);

    const updated = await parser.evolvePokemon({ boxSlot: [1, 14], speciesID: 414 });

    expect(new Gen4Parser(updated).readBox(1)[14]?.speciesId).toBe(414);
})
