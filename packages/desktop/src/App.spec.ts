import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import App from "./App.vue";

describe("App", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {}),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("shows loading state initially", () => {
    const wrapper = mount(App);

    expect(wrapper.text()).toContain("正在检查服务器连接");
  });

  it("shows connected state when health check succeeds on first attempt", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "ok",
          timestamp: "2026-06-01T12:00:00.000Z",
          version: "0.0.2",
        }),
    } as Response);

    const wrapper = mount(App);

    await vi.runAllTimersAsync();

    expect(wrapper.text()).toContain("已连接");
  });

  it("retries and shows connected when health check succeeds on third attempt", async () => {
    let calls = 0;
    fetchSpy.mockImplementation(() => {
      calls++;
      if (calls < 3) {
        return Promise.reject(new Error("Connection refused"));
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "ok",
            timestamp: "2026-06-01T12:00:00.000Z",
            version: "0.0.2",
          }),
      } as Response);
    });

    const wrapper = mount(App);

    await vi.runAllTimersAsync();

    expect(wrapper.text()).toContain("已连接");
    expect(calls).toBe(3);
  });

  it("shows disconnected after all 3 retries fail", async () => {
    fetchSpy.mockRejectedValue(new Error("Connection refused"));

    const wrapper = mount(App);

    await vi.runAllTimersAsync();

    expect(wrapper.text()).toContain("未连接");
    expect(wrapper.text()).toContain("Connection refused");
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("shows disconnected when server returns non-ok status on every retry", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    } as Response);

    const wrapper = mount(App);

    await vi.runAllTimersAsync();

    expect(wrapper.text()).toContain("未连接");
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("shows timeout message when requests time out", async () => {
    fetchSpy.mockRejectedValue(
      new DOMException("The operation was aborted", "TimeoutError"),
    );

    const wrapper = mount(App);

    await vi.runAllTimersAsync();

    expect(wrapper.text()).toContain("未连接");
    expect(wrapper.text()).toContain("连接超时");
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
