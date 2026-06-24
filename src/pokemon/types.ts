export type PokemonType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

export type GrowthRate =
  | "slow"
  | "medium-slow"
  | "medium-fast"
  | "fast"
  | "erratic"
  | "fluctuating";

export type EggGroup =
  | "monster"
  | "water1"
  | "water2"
  | "water3"
  | "bug"
  | "flying"
  | "field"
  | "fairy"
  | "grass"
  | "human-like"
  | "mineral"
  | "amorphous"
  | "dragon"
  | "ditto"
  | "undiscovered";

export type BodyColor =
  | "black"
  | "blue"
  | "brown"
  | "gray"
  | "green"
  | "pink"
  | "purple"
  | "red"
  | "white"
  | "yellow";

export type BodyShape =
  | "ball"
  | "squiggle"
  | "fish"
  | "arms"
  | "blob"
  | "upright"
  | "legs"
  | "quadruped"
  | "wings"
  | "tentacles"
  | "heads"
  | "humanoid"
  | "bug-wings"
  | "armor";

export type SpeciesAbility = {
  name: string;
  id?: number;
  isHidden: boolean;
};

export type GenderRatio = { genderless: true } | { genderless: false; ratioMale: number };

export type EvYield = Partial<Stats>;

export type Evolution = {
  toSpeciesId: number;
  trigger: string;
  minLevel?: number;
  itemId?: number;
  conditions?: readonly string[];
};

export type DexEntry = {
  version: string;
  text: string;
};

export type LearnableMove = {
  moveId: number;
  method: string;
  level?: number;
};

/** Overrides only the fields that differ from the base species. */
export type SpeciesForm = {
  name: string;
  formId: number;
  types?: readonly PokemonType[];
  baseStats?: Stats;
  abilities?: readonly SpeciesAbility[];
  heightMeters?: number;
  weightKilograms?: number;
};

/** Static, save-independent reference data for a single Pokémon species. */
export type PokemonSpecie = {
  id: number;
  name: string;
  genus: string;
  generation: number;

  types: readonly [PokemonType] | readonly [PokemonType, PokemonType];
  baseStats: Stats;
  abilities: readonly SpeciesAbility[];

  genderRatio: GenderRatio;
  catchRate: number;
  baseExperience: number;
  evYield: EvYield;
  growthRate: GrowthRate;

  eggGroups: readonly EggGroup[];
  hatchCycles: number;
  baseFriendship: number;

  heightMeters: number;
  weightKilograms: number;
  color: BodyColor;
  shape: BodyShape;

  isBaby: boolean;
  isLegendary: boolean;
  isMythical: boolean;

  evolvesTo: readonly Evolution[];
  evolvesFromId?: number;

  moves?: readonly LearnableMove[];
  dexEntries?: readonly DexEntry[];
  forms?: readonly SpeciesForm[];
};

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  specialAttack: number;
  specialDefense: number;
}

/** Gen 1/2 collapsed Special Attack and Special Defense into a single stat. */
export interface StatsGen1 {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
}

export type EffortValues = Stats;
export type StatExperience = StatsGen1;
export type IndividualValues = Stats;
export type DeterminantValues = StatsGen1;

export interface ContestStats {
  coolness: number;
  beauty: number;
  cuteness: number;
  smartness: number;
  toughness: number;
  feel: number;
}

export interface MoveSlot {
  moveId: number;
  pp: number;
  ppUps: number;
}

export type Gender = "male" | "female" | "genderless";

export interface OriginalTrainer {
  name: string;
  trainerId: number;
  /** Hidden secret ID; Gen 3+ only, 0 otherwise. */
  secretId: number;
  gender: Gender;
}

export interface MetInfo {
  locationId: number;
  levelMet: number;
  originGameId: number;
  ballId: number;
}

export interface Markings {
  circle: boolean;
  triangle: boolean;
  square: boolean;
  heart: boolean;
  star?: boolean;
  diamond?: boolean;
}

export interface StatusCondition {
  /** 0 = not asleep. */
  sleepTurns: number;
  poison: boolean;
  burn: boolean;
  freeze: boolean;
  paralysis: boolean;
  badlyPoisoned: boolean;
}

/** Present only for party members; boxed Pokémon reconstruct this on withdrawal. */
export interface PartyData {
  status: StatusCondition;
  level: number;
  currentHp: number;
  stats: Stats | StatsGen1;
}

interface PokemonBase {
  speciesId: number;
  nickname: string;
  ot: OriginalTrainer;
  experience: number;
  heldItemId?: number;
  friendship?: number;
  /** Strain in high nibble, days remaining in low nibble. */
  pokerus?: number;
  party?: PartyData;
}

export interface PokemonGen1 extends PokemonBase {
  generation: 1;
  dvs: DeterminantValues;
  statExperience: StatExperience;
  moves: MoveSlot[];
  typeIds: [number, number];
  catchRateOrHeldItem: number;
}

export interface PokemonGen2 extends PokemonBase {
  generation: 2;
  dvs: DeterminantValues;
  statExperience: StatExperience;
  moves: MoveSlot[];
  gender: Gender;
  isShiny: boolean;
}

export interface PokemonGen3 extends PokemonBase {
  generation: 3;
  /** 32-bit value driving nature, gender, shininess, and ability slot. */
  personalityValue: number;
  natureId: number;
  gender: Gender;
  isShiny: boolean;
  abilitySlot: 0 | 1;
  ivs: IndividualValues;
  evs: EffortValues;
  contest: ContestStats;
  moves: MoveSlot[];
  met: MetInfo;
  hiddenPower: { typeId: number; power: number };
  /** Packed ribbon flags. */
  ribbons: number;
  markings: Markings;
  isEgg: boolean;
  hasObedience: boolean;
}

export interface PokemonGen4 extends PokemonBase {
  generation: 4;
  /** 32-bit value driving nature, gender, shininess, and ability slot. */
  personalityValue: number;
  natureId: number;
  gender: Gender;
  isShiny: boolean;
  /** 2 covers the Gen 5 hidden ability slot. */
  abilitySlot: 0 | 1 | 2;
  abilityId: number;
  ivs: IndividualValues;
  evs: EffortValues;
  contest: ContestStats;
  moves: MoveSlot[];
  met: MetInfo;
  eggMet?: MetInfo;
  hiddenPower: { typeId: number; power: number };
  /** Packed ribbon flags. */
  ribbons: number;
  markings: Markings;
  isEgg: boolean;
  isNicknamed: boolean;
  languageId: number;
  formId: number;
}

export type Pokemon = PokemonGen1 | PokemonGen2 | PokemonGen3 | PokemonGen4;
export type PartyPokemon = Pokemon & PartyData;
export type Generation = Pokemon["generation"];
