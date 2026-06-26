import { spyOn, afterEach } from "bun:test";


export function captureLog() {
  const spy = spyOn(console, "log").mockImplementation(() => {});
  spy.mockClear(); // drop anything captured before this point

  // auto-restore after the current test so calls don't leak
  afterEach(() => spy.mockRestore());

  return {
    spy,
    get text() {
      return spy.mock.calls.map((a) => a.join(" ")).join("\n");
    },
    restore: () => spy.mockRestore(),
  };
}