import { fetchPokemonDataByID } from "../pokemon/data";
import type { PartyPokemon, Pokemon } from "../pokemon/types";


export abstract class BaseParser{
    saveFilePath: string;
    
    constructor(saveFilePath: string){
        this.saveFilePath = saveFilePath;
    }

    abstract readParty(): PartyPokemon[];

    async printPokemon(pokemon: Pokemon){
        const species = await fetchPokemonDataByID(pokemon.speciesId)
        console.log("NAME: ", pokemon.nickname)
        console.log("SPECIES: ", species.name)
        console.log("EXP: ", pokemon.experience)
    }

    async printPartyPokemon(partyPokemon: PartyPokemon){
        await this.printPokemon(partyPokemon)
        console.log("LVL: ", partyPokemon.level)
        console.log("STATUS: ", partyPokemon.status)
        console.log("HP", partyPokemon.currentHp, "/", partyPokemon.stats.hp)
    }
}