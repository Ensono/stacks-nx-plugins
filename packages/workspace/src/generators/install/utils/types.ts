export interface PackageJson {
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  commitlint: unknown;
  config?: {
    commitizen?: unknown;
  };
}
