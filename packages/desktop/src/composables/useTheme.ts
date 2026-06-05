import { ref, computed, watch } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'tauri-ai-starter-theme';
const DEFAULT_MODE: ThemeMode = 'light';

function getSavedMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch { /* localStorage unavailable */ }
  return DEFAULT_MODE;
}

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const mode = ref<ThemeMode>(getSavedMode());
export const systemPrefersDark = ref(getSystemPrefersDark());

export const resolvedTheme = computed<ResolvedTheme>(() =>
  mode.value === 'system'
    ? systemPrefersDark.value ? 'dark' : 'light'
    : mode.value,
);

function applyTheme() {
  const isDark = resolvedTheme.value === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
}

async function syncNativeTheme() {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    if (mode.value === 'system') {
      await getCurrentWindow().setTheme(null);
    } else {
      await getCurrentWindow().setTheme(resolvedTheme.value);
    }
  } catch { /* not in Tauri context */ }
}

let unlistenSystem: (() => void) | null = null;

async function setupSystemListener() {
  // Try Tauri for system theme change detection
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    unlistenSystem = await getCurrentWindow().onThemeChanged(() => {
      systemPrefersDark.value = getSystemPrefersDark();
    });
    return;
  } catch { /* not in Tauri context */ }

  // Web fallback
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => { systemPrefersDark.value = e.matches; };
  mql.addEventListener('change', handler);
  unlistenSystem = () => mql.removeEventListener('change', handler);
}

export function setTheme(m: ThemeMode) {
  mode.value = m;
  try { localStorage.setItem(STORAGE_KEY, m); } catch { /* unavailable */ }
  syncNativeTheme();
}

export function initTheme() {
  applyTheme();
  syncNativeTheme();
  setupSystemListener();
}

export function deinitTheme() {
  unlistenSystem?.();
  unlistenSystem = null;
}

watch(resolvedTheme, () => {
  applyTheme();
  syncNativeTheme();
});
