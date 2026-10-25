import { describe, expect, it } from "bun:test";
import { getErrorMessage } from "../error-utils";

describe("client error messages", () => {
  it("uses centralized Chinese copy for internal server failures", () => {
    expect(getErrorMessage({ message: "Internal server error", data: { code: "INTERNAL_SERVER_ERROR" } }))
      .toBe("暂时无法读取数据，请稍后重试。");
  });

  it("keeps actionable business errors", () => {
    for (const code of ["UNAUTHORIZED", "FORBIDDEN", "BAD_REQUEST"]) {
      expect(getErrorMessage({ message: "Actionable business error", data: { code } })).toBe("Actionable business error");
    }
  });
});
