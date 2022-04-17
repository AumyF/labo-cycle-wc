import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsxFactory: "jsx",
    jsxFragment: "Fragment",
    jsxInject: `import { jsx, Fragment } from "@herp-inc/snabbdom-jsx"`,
  },
});
