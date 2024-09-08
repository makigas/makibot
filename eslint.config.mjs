// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";

export default [
  ...tseslint.config({
    files: ["**/*.ts"],
    extends: [eslint.configs.recommended, ...tseslint.configs.strict],
    rules: {
      complexity: ["warn", { max: 10 }],
    },
  }),
  prettier,
];
