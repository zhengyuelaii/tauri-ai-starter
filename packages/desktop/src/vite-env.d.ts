/// <reference types="vite/client" />

declare const __SERVER_PORT__: string;

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
