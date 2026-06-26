# poke-cli

A CLI for reading and editing Pokémon save files.

## Install

```bash
bun install
bun link        # makes `poke-cli` available globally
```

Or run without linking via `bun start <command>`.

## Usage

```bash
poke-cli get-party ./saves/platinum.sav
poke-cli get-box ./saves/platinum.sav 0
poke-cli get-empty-box-slot ./saves/platinum.sav

poke-cli clone ./from.sav ./to.sav --party 1 --out ./result.sav
poke-cli evolve ./game.sav --box "0,3" --out ./result.sav
```

## Commands

- `get-party` — read the active party
- `get-box` — read a box
- `get-empty-box-slot` — find the next free box slot
- `clone` — copy a Pokémon into another save's first free slot
- `evolve` — evolve a Pokémon in a save

## Help

Every command documents its own arguments and options. Whenever you need details, ask for help directly:

```bash
poke-cli --help
poke-cli <command> --help
```

## Roadmap

### Commands
- [x] Clone
- [x] Evolve
- [ ] Give Item
- [ ] Edit Pokémon
- [ ] Create Pokémon
- [ ] Delete Pokémon


### Support
- [ ] GEN 1
- [ ] GEN 2
- [ ] GEN 3
- [x] GEN 4