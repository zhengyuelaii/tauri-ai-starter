import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import App from "./App.vue";

describe("App", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    // Default: fetch never resolves, so loading state persists
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

  it("shows connected state when health check succeeds", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "ok",
          timestamp: "2026-06-01T12:00:00.000Z",
          version: "0.0.1",
        }),
    } as Response);

    const wrapper = mount(App);

    await vi.runAllTimersAsync();

    expect(wrapper.text()).toContain("已连接");
    expect(wrapper.text()).toContain("0.0.1");
  });

  it("shows disconnected state when health check fails", async () => {
    fetchSpy.mockRejectedValue(new Error("Connection refused"));

    const wrapper = mount(App);

    await vi.runAllTimersAsync();

    expect(wrapper.text()).toContain("未连接");
    expect(wrapper.text()).toContain("Connection refused");
  });

  it("shows disconnected state when server returns non-ok status", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ error: "Service Unavailable" }),
    } as Response);

    const wrapper = mount(App);

    await vi.runAllTimersAsync();

    expect(wrapper.text()).toContain("未连接");
    expect(wrapper.text()).toContain("503");
  });

  it("shows timeout error when health check takes too long", async () => {
    fetchSpy.mockImplementation((_url, opts) => {
      const signal = (opts as RequestInit)?.signal;
      return new Promise((_resolve, reject) => {
        if (signal) {
          signal.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }
      });
    });

    const wrapper = mount(App);

    await vi.advanceTimersByTimeAsync(5000);

    expect(wrapper.text()).toContain("未连接");
    expect(wrapper.text()).toContain("连接超时");
  });
});
