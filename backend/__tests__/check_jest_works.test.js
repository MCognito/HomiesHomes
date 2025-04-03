/**
 * Sanity check for Jest
 *
 * Just making sure our test framework is set up and running
 */

describe("Basic Testing Setup", () => {
  test("Jest is working correctly", () => {
    expect(1 + 1).toBe(2);
  });

  test("Async testing works", async () => {
    const asyncFunc = () => Promise.resolve("success");
    const result = await asyncFunc();
    expect(result).toBe("success");
  });

  test("Environment variables are set correctly", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });

  test("Mock functions work correctly", () => {
    const mockFn = jest.fn();
    mockFn();
    expect(mockFn).toHaveBeenCalled();
  });

  test("Test can handle objects", () => {
    const obj = { name: "test", value: 42 };
    expect(obj).toEqual({ name: "test", value: 42 });
    expect(obj).toHaveProperty("name", "test");
  });
});
