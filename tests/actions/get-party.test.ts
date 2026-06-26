import { test, expect } from "bun:test";
import { getParser } from "../../src/parsers/decider";
import { captureLog } from "../utils";
import { getParty } from "../../src/actions/get-party";

test("It returns all JSON party for gen 4 pokemon", () => {
  const path = "./saves/platinum.sav";
  const out = captureLog();
  const parser = getParser(path);

  getParty(path, {});

  expect(out.text).toBe(JSON.stringify(parser.readParty()));
});

test("It returns one JSON party for gen 4 pokemon", () => {
  const path = "./saves/platinum.sav";
  const out = captureLog();
  const parser = getParser(path);

  getParty(path, {index:"0"});

  expect(out.text).toBe(JSON.stringify(parser.readParty()[0]));
});