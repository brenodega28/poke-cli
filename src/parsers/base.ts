import { fetchPokemonDataByID } from "../pokemon/data";
import type { PartyPokemon, Pokemon } from "../pokemon/types";

type WithOutFile = {outFile: string;}

export type EvolvePokemonArgs = {
    boxSlot?: [number,number];
    partySlot?: number;
    speciesID?: number;
} & WithOutFile

export type WritePokemonToBoxSlotArgs = {
    pokemon: Pokemon;
    boxSlot: [number, number];
} & WithOutFile

export abstract class BaseParser{
    saveFilePath: string;
    
    constructor(saveFilePath: string){
        this.saveFilePath = saveFilePath;
    }

    abstract readParty(): PartyPokemon[];
    abstract readBox(boxID: number): Pokemon[];
    abstract getEmptyBoxSlot(): [number, number];
    abstract writePokemonToBoxSlot(args: WritePokemonToBoxSlotArgs): void;
    abstract evolvePokemon(args: EvolvePokemonArgs): void;

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