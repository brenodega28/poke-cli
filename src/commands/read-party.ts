import { Command } from "commander";
import { getParser } from "../parsers/decider";

export function loadReadPartyCommand(program: Command) {
  program
    .command("readParty")
    .description("Reads an active party pokemon from a savefile")
    .argument('<path>', 'Path to the savefile')
    .argument('<index>', 'Pokemon party index')
    .action(async (path, index) => {
      const parser = getParser(path)
      const party = parser.readParty()
      const pokemon = index <= party.length ? party[index] : undefined

      if(!pokemon){
        console.log("No Pokémon at index", index)
        return;
      }
      
      await parser.printPartyPokemon(pokemon)
    });
}
