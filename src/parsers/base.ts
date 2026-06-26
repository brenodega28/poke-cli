import { fetchPokemonDataByID } from "../pokemon/data";
import type { PartyPokemon, Pokemon } from "../pokemon/types";

export type EvolvePokemonArgs = {
    boxSlot?: [number,number];
    partySlot?: number;
    speciesID?: number;
}

export type WritePokemonToBoxSlotArgs = {
    pokemon: Pokemon;
    boxSlot: [number, number];
}

export abstract class BaseParser{
    protected save: Uint8Array;

    constructor(save: Uint8Array){
        this.save = save;
    }

    abstract readParty(): PartyPokemon[];
    abstract readBox(boxID: number): Pokemon[];
    abstract getEmptyBoxSlot(): [number, number];
    abstract writePokemonToBoxSlot(args: WritePokemonToBoxSlotArgs): Uint8Array;
    abstract evolvePokemon(args: EvolvePokemonArgs): Promise<Uint8Array>;

    async printPokemon(pokemon: Pokemon){
        const species = await fetchPokemonDataByID(pokemon.speciesId)
        console.log("NAME: ", pokemon.nickname)
        console.log("SPECIES: ", species.name)
        console.log("POKEDEX No: ", pokemon.speciesId)
        console.log("EXP: ", pokemon.experience)
    }

    async printPartyPokemon(partyPokemon: PartyPokemon){
        await this.printPokemon(partyPokemon)
        console.log("LVL: ", partyPokemon.level)
        console.log("STATUS: ", partyPokemon.status)
        console.log("HP", partyPokemon.currentHp, "/", partyPokemon.stats.hp)
    }

    async printBoxPokemon(boxPokemon: Pokemon, boxPos: [number, number]){
        await this.printPokemon(boxPokemon)
        console.log("Box: ", boxPos[0], "Position: ", boxPos[1])
    }
}