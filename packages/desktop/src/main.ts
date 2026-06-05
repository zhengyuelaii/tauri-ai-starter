import { createApp } from "vue";
import App from "./App.vue";
import { i18n } from "./composables/useLocale";
import { initTheme } from "./composables/useTheme";
import "./index.css";

initTheme();

const app = createApp(App);
app.use(i18n);
app.mount("#app");
