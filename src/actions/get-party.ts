import { getParser } from "../parsers/decider";

export async function getParty(path: string, options: Record<string, string>) {
  const parser = getParser(path);
  const party = parser.readParty();

  if (options.index) {
    const index = parseInt(options.index);
    const pokemon = index <= party.length ? party[index] : undefined;

    if (!pokemon) {
      console.error("No Pokémon at index", index);
      return;
    }

    console.log(JSON.stringify(pokemon));
    return;
  }

  console.log(JSON.stringify(party));
}
