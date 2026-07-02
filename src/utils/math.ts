import type { IndividualValues, EffortValues, Stats } from "../pokemon/types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const NATURE_STATS = ["attack", "defense", "speed", "specialAttack", "specialDefense"] as const;

/** Gen 3+ battle stats from base stats, IVs, EVs, level, and nature. */
export function computeStats(
  base: Stats,
  ivs: IndividualValues,
  evs: EffortValues,
  level: number,
  natureId: number,
): Stats {
  const core = (key: keyof Stats): number =>
    Math.floor(((2 * base[key] + ivs[key] + Math.floor(evs[key] / 4)) * level) / 100);

  const increased = Math.floor(natureId / 5);
  const decreased = natureId % 5;
  const withNature = (key: (typeof NATURE_STATS)[number], index: number): number => {
    const modifier = index === increased && index !== decreased
      ? 1.1
      : index === decreased && index !== increased
        ? 0.9
        : 1;
    return Math.floor((core(key) + 5) * modifier);
  };

  return {
    hp: core("hp") + level + 10,
    attack: withNature("attack", 0),
    defense: withNature("defense", 1),
    speed: withNature("speed", 2),
    specialAttack: withNature("specialAttack", 3),
    specialDefense: withNature("specialDefense", 4),
  };
}

/** Hidden Power type (0–15) and power (30–70), derived from the IV low bits. */
export function computeHiddenPower(ivs: IndividualValues): { typeId: number; power: number } {
  const order = [ivs.hp, ivs.attack, ivs.defense, ivs.speed, ivs.specialAttack, ivs.specialDefense];
  let typeSum = 0;
  let powerSum = 0;
  order.forEach((iv, i) => {
    typeSum += (iv & 1) << i;
    powerSum += ((iv >> 1) & 1) << i;
  });
  return {
    typeId: Math.floor((typeSum * 15) / 63),
    power: 30 + Math.floor((powerSum * 40) / 63),
  };
}