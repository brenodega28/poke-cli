import { z } from "zod";

import type {
  BodyColor,
  BodyShape,
  DexEntry,
  EggGroup,
  Evolution,
  GenderRatio,
  GrowthRate,
  LearnableMove,
  PokemonSpecie,
  PokemonType,
  SpeciesAbility,
  Stats,
} from "./types";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";

const POKEMON_TYPE_NAMES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const satisfies readonly PokemonType[];

const BODY_COLOR_NAMES = [
  "black",
  "blue",
  "brown",
  "gray",
  "green",
  "pink",
  "purple",
  "red",
  "white",
  "yellow",
] as const satisfies readonly BodyColor[];

const BODY_SHAPE_NAMES = [
  "ball",
  "squiggle",
  "fish",
  "arms",
  "blob",
  "upright",
  "legs",
  "quadruped",
  "wings",
  "tentacles",
  "heads",
  "humanoid",
  "bug-wings",
  "armor",
] as const satisfies readonly BodyShape[];

const ROMAN_NUMERALS: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
  ix: 9,
};

const EGG_GROUP_MAP: Record<string, EggGroup> = {
  monster: "monster",
  water1: "water1",
  water2: "water2",
  water3: "water3",
  bug: "bug",
  flying: "flying",
  ground: "field",
  fairy: "fairy",
  plant: "grass",
  humanshape: "human-like",
  mineral: "mineral",
  indeterminate: "amorphous",
  dragon: "dragon",
  ditto: "ditto",
  "no-eggs": "undiscovered",
};

const GROWTH_RATE_MAP: Record<string, GrowthRate> = {
  slow: "slow",
  medium: "medium-fast",
  "medium-slow": "medium-slow",
  fast: "fast",
  "slow-then-very-fast": "erratic",
  "fast-then-very-slow": "fluctuating",
};

const namedResource = z.object({ name: z.string(), url: z.string() });

const pokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  base_experience: z.number().nullish(),
  types: z.array(
    z.object({
      slot: z.number(),
      type: z.object({ name: z.enum(POKEMON_TYPE_NAMES), url: z.string() }),
    }),
  ),
  stats: z.array(z.object({ base_stat: z.number(), effort: z.number(), stat: namedResource })),
  abilities: z.array(
    z.object({ ability: namedResource, is_hidden: z.boolean(), slot: z.number() }),
  ),
  moves: z.array(
    z.object({
      move: namedResource,
      version_group_details: z.array(
        z.object({ level_learned_at: z.number(), move_learn_method: namedResource }),
      ),
    }),
  ),
});

const speciesSchema = z.object({
  gender_rate: z.number(),
  capture_rate: z.number(),
  base_happiness: z.number().nullish(),
  hatch_counter: z.number().nullish(),
  is_baby: z.boolean(),
  is_legendary: z.boolean(),
  is_mythical: z.boolean(),
  growth_rate: namedResource.nullish(),
  color: z.object({ name: z.enum(BODY_COLOR_NAMES), url: z.string() }),
  shape: z.object({ name: z.enum(BODY_SHAPE_NAMES), url: z.string() }).nullish(),
  generation: namedResource,
  egg_groups: z.array(namedResource),
  genera: z.array(z.object({ genus: z.string(), language: namedResource })),
  flavor_text_entries: z.array(
    z.object({ flavor_text: z.string(), language: namedResource, version: namedResource }),
  ),
  evolves_from_species: namedResource.nullish(),
  evolution_chain: z.object({ url: z.string() }),
});

const evolutionDetailSchema = z.object({
  trigger: namedResource,
  min_level: z.number().nullish(),
  item: namedResource.nullish(),
  held_item: namedResource.nullish(),
  min_happiness: z.number().nullish(),
  min_beauty: z.number().nullish(),
  min_affection: z.number().nullish(),
  time_of_day: z.string().nullish(),
  location: namedResource.nullish(),
  known_move: namedResource.nullish(),
  known_move_type: namedResource.nullish(),
  needs_overworld_rain: z.boolean().nullish(),
  turn_upside_down: z.boolean().nullish(),
  gender: z.number().nullish(),
  relative_physical_stats: z.number().nullish(),
  party_species: namedResource.nullish(),
  trade_species: namedResource.nullish(),
});

type EvolutionDetail = z.infer<typeof evolutionDetailSchema>;

type ChainLink = {
  species: { name: string; url: string };
  evolution_details: EvolutionDetail[];
  evolves_to: ChainLink[];
};

const chainLinkSchema: z.ZodType<ChainLink> = z.lazy(() =>
  z.object({
    species: namedResource,
    evolution_details: z.array(evolutionDetailSchema),
    evolves_to: z.array(chainLinkSchema),
  }),
);

const evolutionChainSchema = z.object({ chain: chainLinkSchema });

export async function fetchPokemonDataByID(id: number): Promise<PokemonSpecie> {
  const [pokemon, species] = await Promise.all([
    fetchJson(`${POKEAPI_BASE}/pokemon/${id}`, pokemonSchema),
    fetchJson(`${POKEAPI_BASE}/pokemon-species/${id}`, speciesSchema),
  ]);

  const chain = await fetchJson(species.evolution_chain.url, evolutionChainSchema);
  const evolvesTo = resolveEvolutions(chain.chain, id);
  const evolvesFromId = species.evolves_from_species
    ? idFromUrl(species.evolves_from_species.url)
    : undefined;

  const dexEntries = extractDexEntries(species.flavor_text_entries);
  const moves = extractMoves(pokemon.moves);

  return {
    id: pokemon.id,
    name: pokemon.name,
    genus: findEnglishGenus(species.genera),
    generation: generationNumber(species.generation.name),

    types: pickTypes(pokemon.types),
    baseStats: pickStats(pokemon.stats, "base_stat"),
    abilities: pokemon.abilities.map(toSpeciesAbility),

    genderRatio: toGenderRatio(species.gender_rate),
    catchRate: species.capture_rate,
    baseExperience: pokemon.base_experience ?? 0,
    evYield: pickStats(pokemon.stats, "effort"),
    growthRate: mapGrowthRate(species.growth_rate?.name),

    eggGroups: species.egg_groups.map((group) => mapEggGroup(group.name)),
    hatchCycles: species.hatch_counter ?? 0,
    baseFriendship: species.base_happiness ?? 0,

    heightMeters: pokemon.height / 10,
    weightKilograms: pokemon.weight / 10,
    color: species.color.name,
    shape: requireShape(species.shape?.name),

    isBaby: species.is_baby,
    isLegendary: species.is_legendary,
    isMythical: species.is_mythical,

    evolvesTo,
    ...(evolvesFromId !== undefined ? { evolvesFromId } : {}),
    ...(moves.length > 0 ? { moves } : {}),
    ...(dexEntries.length > 0 ? { dexEntries } : {}),
  };
}

async function fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PokeAPI request failed (${response.status} ${response.statusText}) for ${url}`);
  }
  return schema.parse(await response.json());
}

function idFromUrl(url: string): number {
  const segment = url.split("/").filter(Boolean).at(-1);
  const parsed = Number(segment);
  if (!Number.isInteger(parsed)) throw new Error(`Could not parse id from URL: ${url}`);
  return parsed;
}

function pickTypes(
  types: ReadonlyArray<{ slot: number; type: { name: PokemonType } }>,
): readonly [PokemonType] | readonly [PokemonType, PokemonType] {
  const [first, second] = [...types]
    .sort((a, b) => a.slot - b.slot)
    .map((entry) => entry.type.name);
  if (!first) throw new Error("PokeAPI returned a Pokémon with no types");
  return second ? [first, second] : [first];
}

function pickStats(
  stats: ReadonlyArray<{ base_stat: number; effort: number; stat: { name: string } }>,
  field: "base_stat" | "effort",
): Stats {
  const valueOf = (name: string): number =>
    stats.find((entry) => entry.stat.name === name)?.[field] ?? 0;
  return {
    hp: valueOf("hp"),
    attack: valueOf("attack"),
    defense: valueOf("defense"),
    speed: valueOf("speed"),
    specialAttack: valueOf("special-attack"),
    specialDefense: valueOf("special-defense"),
  };
}

function toSpeciesAbility(entry: {
  ability: { name: string; url: string };
  is_hidden: boolean;
}): SpeciesAbility {
  return { name: entry.ability.name, id: idFromUrl(entry.ability.url), isHidden: entry.is_hidden };
}

function toGenderRatio(genderRate: number): GenderRatio {
  if (genderRate < 0) return { genderless: true };
  return { genderless: false, ratioMale: (8 - genderRate) / 8 };
}

function extractMoves(
  moves: ReadonlyArray<{
    move: { name: string; url: string };
    version_group_details: ReadonlyArray<{
      level_learned_at: number;
      move_learn_method: { name: string };
    }>;
  }>,
): LearnableMove[] {
  const seen = new Set<string>();
  const result: LearnableMove[] = [];
  for (const { move, version_group_details } of moves) {
    const moveId = idFromUrl(move.url);
    for (const detail of version_group_details) {
      const method = detail.move_learn_method.name;
      const entry: LearnableMove =
        method === "level-up"
          ? { moveId, method, level: detail.level_learned_at }
          : { moveId, method };
      const key = `${entry.moveId}:${entry.method}:${entry.level ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(entry);
    }
  }
  return result;
}

function extractDexEntries(
  entries: ReadonlyArray<{
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }>,
): DexEntry[] {
  const seen = new Set<string>();
  const result: DexEntry[] = [];
  for (const entry of entries) {
    if (entry.language.name !== "en") continue;
    const text = entry.flavor_text.replace(/­/g, "").replace(/\s+/g, " ").trim();
    if (seen.has(text)) continue;
    seen.add(text);
    result.push({ version: entry.version.name, text });
  }
  return result;
}

function resolveEvolutions(root: ChainLink, speciesId: number): Evolution[] {
  const node = findChainNode(root, speciesId);
  if (!node) return [];
  return node.evolves_to.map(toEvolution);
}

function findChainNode(link: ChainLink, speciesId: number): ChainLink | undefined {
  if (idFromUrl(link.species.url) === speciesId) return link;
  for (const child of link.evolves_to) {
    const found = findChainNode(child, speciesId);
    if (found) return found;
  }
  return undefined;
}

function toEvolution(child: ChainLink): Evolution {
  const detail = child.evolution_details[0];
  const toSpeciesId = idFromUrl(child.species.url);
  if (!detail) return { toSpeciesId, trigger: "unknown" };

  const conditions = collectConditions(detail);
  return {
    toSpeciesId,
    trigger: detail.trigger.name,
    ...(detail.min_level != null ? { minLevel: detail.min_level } : {}),
    ...(detail.item ? { itemId: idFromUrl(detail.item.url) } : {}),
    ...(conditions.length > 0 ? { conditions } : {}),
  };
}

function collectConditions(detail: EvolutionDetail): string[] {
  const conditions: string[] = [];
  if (detail.time_of_day) conditions.push(`time:${detail.time_of_day}`);
  if (detail.min_happiness != null) conditions.push(`happiness:${detail.min_happiness}`);
  if (detail.min_affection != null) conditions.push(`affection:${detail.min_affection}`);
  if (detail.min_beauty != null) conditions.push(`beauty:${detail.min_beauty}`);
  if (detail.needs_overworld_rain) conditions.push("rain");
  if (detail.turn_upside_down) conditions.push("upside-down");
  if (detail.gender != null) conditions.push(`gender:${detail.gender}`);
  if (detail.relative_physical_stats != null) {
    conditions.push(`phys:${detail.relative_physical_stats}`);
  }
  if (detail.location) conditions.push(`location:${detail.location.name}`);
  if (detail.known_move) conditions.push(`move:${detail.known_move.name}`);
  if (detail.known_move_type) conditions.push(`move-type:${detail.known_move_type.name}`);
  if (detail.held_item) conditions.push(`hold:${detail.held_item.name}`);
  if (detail.party_species) conditions.push(`party:${detail.party_species.name}`);
  if (detail.trade_species) conditions.push(`trade-with:${detail.trade_species.name}`);
  return conditions;
}

function findEnglishGenus(
  genera: ReadonlyArray<{ genus: string; language: { name: string } }>,
): string {
  return genera.find((entry) => entry.language.name === "en")?.genus ?? "";
}

function generationNumber(name: string): number {
  const value = ROMAN_NUMERALS[name.replace("generation-", "")];
  if (value === undefined) throw new Error(`Unexpected generation from PokeAPI: ${name}`);
  return value;
}

function mapEggGroup(name: string): EggGroup {
  const mapped = EGG_GROUP_MAP[name];
  if (mapped === undefined) throw new Error(`Unexpected egg group from PokeAPI: ${name}`);
  return mapped;
}

function mapGrowthRate(name: string | null | undefined): GrowthRate {
  const mapped = name == null ? undefined : GROWTH_RATE_MAP[name];
  if (mapped === undefined) throw new Error(`Unexpected growth rate from PokeAPI: ${name}`);
  return mapped;
}

function requireShape(name: BodyShape | null | undefined): BodyShape {
  if (name == null) throw new Error("PokeAPI returned a species with no shape");
  return name;
}
