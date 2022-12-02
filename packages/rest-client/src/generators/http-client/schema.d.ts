export interface HttpClientGeneratorSchema {
  name: string;
  linter: Linter;
  unitTestRunner: 'jest' | 'none';
  directory?: string;
  tags?: string;
  skipFormat?: boolean;
  skipPackageJson?: boolean;
}
