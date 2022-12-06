import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/js';
import * as path from 'path';
import { HttpClientGeneratorSchema } from './schema';
import { axiosVersion } from '../../../utils/versions';

interface NormalizedSchema extends HttpClientGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: HttpClientGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function updateDependencies(tree: Tree) {
  return addDependenciesToPackageJson(
    tree,
    {
      axios: axiosVersion,
    },
    {}
  );
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };

  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

export default async function (tree: Tree, options: HttpClientGeneratorSchema) {
  // Normalize options
  const normalizedOptions = normalizeOptions(tree, options);

  // Use the existing library generator
  await libraryGenerator(tree, { ...options, importPath: 'test-path' });
  // Delete the default generated lib folder
  tree.delete(path.join(normalizedOptions.projectRoot, 'src', 'lib'));

  // Generate files
  addFiles(tree, normalizedOptions);
  // Update package.json
  updateDependencies(tree);

  // Format files
  if (!options.skipFormat) {
    await formatFiles(tree);
  }
}
