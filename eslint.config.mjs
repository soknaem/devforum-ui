import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Safe fallback if @rushstack/eslint-patch fails on ESLint 9
let eslintConfig = [];
try {
  eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
  ];
} catch {
  eslintConfig = [
    {
      ignores: [".next/**", "node_modules/**", "dist/**"],
    },
  ];
}

export default eslintConfig;