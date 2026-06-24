#!/usr/bin/env node

import { Command } from "commander";
import { loadReadPartyCommand } from "./commands/read-party";

const program = new Command();
program
.name('typescript-cli-tool')
.description('A powerful CLI tool built with TypeScript')
.version('1.0.0');
loadReadPartyCommand(program);
program.parse(process.argv);