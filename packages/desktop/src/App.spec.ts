import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import App from "./App.vue";

describe("App", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      (url) => {
        const urlStr = String(url);
        if (urlStr.includes("/api/platforms")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                platforms: [
                  {
                    key: "siliconflow",
                    name: "SiliconFlow",
                    connected: true,
                    models: [
                      {
                        id: "v4-flash",
                        name: "DeepSeek V4 Flash",
                        modelId: "deepseek-ai/DeepSeek-V4-Flash",
                        supportsThinking: true,
                        enabled: true,
                      },
                    ],
                  },
                ],
              }),
          } as Response);
        }
        if (urlStr.includes("/api/sessions")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: [] }),
          } as Response);
        }
        // health check
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: "ok",
              version: "0.0.2",
              timestamp: new Date().toISOString(),
            }),
        } as Response);
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders the chat interface", () => {
    const wrapper = mount(App);

    expect(wrapper.text()).toContain("有什么我可以帮助你的？");
  });

  it("fetches platforms and health on mount", async () => {
    mount(App);

    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();

    const calls = fetchSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((url) => url.includes("/api/platforms"))).toBe(true);
    expect(calls.some((url) => url.includes("/health"))).toBe(true);
  });

  it("renders ChatInput component", () => {
    const wrapper = mount(App);

    expect(wrapper.findComponent({ name: "ChatInput" }).exists()).toBe(true);
  });
});
