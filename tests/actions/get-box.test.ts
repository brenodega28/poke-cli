import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { getParser } from "../../src/parsers/decider";
import { getBox } from "../../src/actions/get-box";
import { captureLog } from "../utils";

test("It returns JSON box for gen 4 pokemon", () => {
  const path = "./saves/platinum.sav";
  const out = captureLog();
  const parser = getParser(readFileSync(path));

  getBox(path, "0");

  expect(out.text).toBe(JSON.stringify(parser.readBox(0)));
});
