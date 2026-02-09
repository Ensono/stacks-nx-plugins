import { joinPathFragments, Tree, logger } from '@nx/devkit';
import { spawnSync } from 'child_process';
import { Project, SyntaxKind } from 'ts-morph';

/**
 * Returns a function that formats files by running the project's lint target with --fix.
 * Works with both legacy .eslintrc.json and modern flat config formats.
 *
 * @param project - The project name to run lint on
 * @returns A function that runs the lint command
 *
 * @example
 * ```typescript
 * return runTasksInSerial(
 *   formatFiles(tree),
 *   formatFilesWithEslint(project.name)
 * );
 * ```
 */
export function formatFilesWithEslint(project: string) {
    return () => {
        const { stdout, stderr } = spawnSync(
            'npx',
            ['nx', 'run', `${project}:lint`, '--fix', '--verbose'],
            {
                env: { ...process.env, FORCE_COLOR: '3' },
                shell: true,
            },
        );

        if (stderr.toString()) {
            logger.log(stdout.toString());
        }
    };
}

/* eslint-disable @typescript-eslint/no-use-before-define */

/**
 * Parse a config object string into key-value pairs
 */
function parseConfigObject(configText: string): Record<string, string> {
    const properties: Record<string, string> = {};
    const trimmed = configText.trim().replace(/^{|}$/g, '').trim();
    let depth = 0;
    let currentKey = '';
    let currentValue = '';
    let inKey = true;

    for (let index = 0; index < trimmed.length; index++) {
        const char = trimmed[index];

        if (char === '{' || char === '[') depth++;
        if (char === '}' || char === ']') depth--;

        if (depth === 0 && char === ':' && inKey) {
            currentKey = currentValue.trim();
            currentValue = '';
            inKey = false;
        } else if (depth === 0 && char === ',' && !inKey) {
            properties[currentKey] = currentValue.trim().replace(/,$/, '');
            currentValue = '';
            currentKey = '';
            inKey = true;
        } else {
            currentValue += char;
        }
    }

    // Add the last property
    if (currentKey && currentValue) {
        properties[currentKey] = currentValue.trim().replace(/,$/, '');
    }

    return properties;
}

/**
 * Merge two rules objects, with override taking precedence
 */
function mergeRulesObjects(existing: string, override: string): string {
    const existingRules = parseNestedObject(existing);
    const overrideRules = parseNestedObject(override);

    return reconstructNestedObject({ ...existingRules, ...overrideRules });
}

/**
 * Merge two plugins objects, with override taking precedence
 */
function mergePluginsObjects(existing: string, override: string): string {
    const existingPlugins = parseNestedObject(existing);
    const overridePlugins = parseNestedObject(override);

    return reconstructNestedObject({ ...existingPlugins, ...overridePlugins });
}

/**
 * Parse nested object like rules or plugins
 */
function parseNestedObject(objectText: string): Record<string, string> {
    const trimmed = objectText.trim().replace(/^{|}$/g, '').trim();
    const properties: Record<string, string> = {};
    let depth = 0;
    let currentKey = '';
    let currentValue = '';
    let inKey = true;

    for (let index = 0; index < trimmed.length; index++) {
        const char = trimmed[index];

        if (char === '{' || char === '[') depth++;
        if (char === '}' || char === ']') depth--;

        if (depth === 0 && char === ':' && inKey) {
            currentKey = currentValue.trim().replace(/['"]/g, '');
            currentValue = '';
            inKey = false;
        } else if (depth === 0 && char === ',' && !inKey) {
            properties[currentKey] = currentValue.trim();
            currentValue = '';
            currentKey = '';
            inKey = true;
        } else {
            currentValue += char;
        }
    }

    if (currentKey && currentValue) {
        properties[currentKey] = currentValue.trim();
    }

    return properties;
}

/**
 * Reconstruct a nested object from key-value pairs
 */
function reconstructNestedObject(properties: Record<string, string>): string {
    const entries = Object.entries(properties).map(
        ([key, value]) => `'${key}': ${value}`,
    );

    return `{\n            ${entries.join(',\n            ')},\n        }`;
}

/**
 * Reconstruct a config object from key-value pairs
 * Always places 'name' property first if present
 */
function reconstructConfigObject(properties: Record<string, string>): string {
    const entries: string[] = [];

    // Always place 'name' first if it exists
    if (properties['name']) {
        const trimmedValue = properties['name'].trim().replace(/,$/, '');

        entries.push(`name: ${trimmedValue}`);
    }

    // Add all other properties
    for (const [key, value] of Object.entries(properties)) {
        if (key !== 'name') {
            const trimmedValue = value.trim().replace(/,$/, '');

            entries.push(`${key}: ${trimmedValue}`);
        }
    }

    return `{\n        ${entries.join(',\n        ')},\n    }`;
}

/**
 * Merge two config objects by combining their properties
 * Rules and other nested objects are merged, with override taking precedence
 * @param existing - Existing config object text
 * @param override - Override config object text
 * @returns Merged config object text
 */
function mergeConfigObjects(existing: string, override: string): string {
    // Extract properties from both objects
    const existingProperties = parseConfigObject(existing);
    const overrideProperties = parseConfigObject(override);
    // Start building the merged config
    const merged: Record<string, string> = { ...existingProperties };

    // Merge override properties
    for (const [key, value] of Object.entries(overrideProperties)) {
        if (key === 'rules' && merged['rules']) {
            // Merge rules objects
            merged['rules'] = mergeRulesObjects(merged['rules'], value);
        } else if (key === 'plugins' && merged['plugins']) {
            // Merge plugins objects
            merged['plugins'] = mergePluginsObjects(merged['plugins'], value);
        } else if (key === 'ignores' && merged['ignores']) {
            // Merge ignores arrays - combine and deduplicate
            const existingIgnores = merged['ignores']
                .replace(/^\[|\]$/g, '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
            const newIgnores = value
                .replace(/^\[|\]$/g, '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
            const combinedIgnores = [
                ...new Set([...existingIgnores, ...newIgnores]),
            ];

            merged['ignores'] = `[${combinedIgnores.join(', ')}]`;
        } else {
            // Override other properties
            merged[key] = value;
        }
    }

    // Reconstruct the config object
    return reconstructConfigObject(merged);
}

/* eslint-enable @typescript-eslint/no-use-before-define */

/**
 * Get the path to the flat ESLint config file for a project
 * @param tree - Nx virtual file system
 * @param projectRoot - Root path of the project
 * @returns Path to the config file or null if not found
 */
export function getFlatConfigPath(
    tree: Tree,
    projectRoot: string,
): string | null {
    const extensions = ['mjs', 'js', 'cjs'];

    for (const extension of extensions) {
        const configPath = joinPathFragments(
            projectRoot,
            `eslint.config.${extension}`,
        );

        if (tree.exists(configPath)) {
            return configPath;
        }
    }

    return null;
}

/**
 * Read the flat ESLint config file content
 * @param tree - Nx virtual file system
 * @param projectRoot - Root path of the project
 * @returns Config file content as string or null if not found
 */
export function readFlatEslintConfig(
    tree: Tree,
    projectRoot: string,
): string | null {
    const configPath = getFlatConfigPath(tree, projectRoot);

    if (!configPath) {
        return null;
    }

    return tree.read(configPath, 'utf-8');
}

/**
 * Write a flat ESLint config file
 * @param tree - Nx virtual file system
 * @param projectRoot - Root path of the project
 * @param content - Config file content
 */
export function writeFlatEslintConfig(
    tree: Tree,
    projectRoot: string,
    content: string,
): void {
    const configPath = joinPathFragments(projectRoot, 'eslint.config.mjs');

    tree.write(configPath, content);
}

/**
 * Extract default import name from import declaration
 * @param importDeclaration - ts-morph ImportDeclaration
 * @returns Default import identifier or undefined
 */
function getDefaultImportName(importDeclaration: any): string | undefined {
    const defaultImport = importDeclaration.getDefaultImport();

    return defaultImport?.getText();
}

/**
 * Extract plugin keys from a config object
 * @param objectLiteral - Object literal text
 * @returns Array of plugin keys or undefined
 */
function getPluginKeys(objectLiteral: string): string[] | undefined {
    // Match plugins: { 'key1': var1, 'key2': var2, key3: var3 }
    const pluginsMatch = /plugins:\s*\{([^}]+)\}/.exec(objectLiteral);

    if (!pluginsMatch) {
        return undefined;
    }

    const pluginsContent = pluginsMatch[1];
    const keys: string[] = [];
    // Extract all keys (quoted or unquoted)
    const keyMatches = pluginsContent.matchAll(/['"]?([^'":,\s]+)['"]?\s*:/g);

    for (const match of keyMatches) {
        keys.push(match[1]);
    }

    return keys.length > 0 ? keys : undefined;
}

/**
 * Check if a config object only contains ignores
 * @param config - Config object text
 * @returns true if config only has ignores property
 */
function isIgnoresOnlyConfig(config: string): boolean {
    // Check if config has ignores
    const hasIgnores = /ignores:\s*\[/.test(config);

    if (!hasIgnores) {
        return false;
    }

    // Check that it doesn't have other meaningful properties
    const hasFiles = /files:\s*\[/.test(config);
    const hasPlugins = /plugins:\s*\{/.test(config);
    const hasRules = /rules:\s*\{/.test(config);
    const hasName = /name:\s*['"]/.test(config);

    return !hasFiles && !hasPlugins && !hasRules && !hasName;
}

/**
 * Check if two configs are duplicates based on files, plugins, or ignores-only
 * @param config1 - First config text
 * @param config2 - Second config text
 * @returns true if configs are duplicates
 */
function areConfigsDuplicate(config1: string, config2: string): boolean {
    // Check if both are ignores-only configs (merge all ignores-only together)
    if (isIgnoresOnlyConfig(config1) && isIgnoresOnlyConfig(config2)) {
        return true;
    }

    // Check files match
    const files1 = /files:\s*\[([^\]]+)\]/.exec(config1)?.[1];
    const files2 = /files:\s*\[([^\]]+)\]/.exec(config2)?.[1];

    if (files1 && files2 && files1 === files2) {
        return true;
    }

    // Check plugins match
    const plugins1 = getPluginKeys(config1);
    const plugins2 = getPluginKeys(config2);

    if (plugins1 && plugins2) {
        const sorted1 = plugins1.sort().join(',');
        const sorted2 = plugins2.sort().join(',');

        if (sorted1 === sorted2) {
            return true;
        }
    }

    return false;
}

/**
 * Merge ESLint flat config with proper import handling using ts-morph exclusively
 * @param tree - Nx virtual file system
 * @param projectRoot - Root path of the project
 * @param snippetWithImports - New config content (must include imports and config)
 */
export function mergeEslintConfig(
    tree: Tree,
    projectRoot: string,
    snippetWithImports: string,
): void {
    const configPath = getFlatConfigPath(tree, projectRoot);

    if (!configPath) {
        // No existing config, write the snippet as-is
        writeFlatEslintConfig(tree, projectRoot, snippetWithImports);

        return;
    }

    const existingContent = tree.read(configPath, 'utf-8') || '';
    const project = new Project({ useInMemoryFileSystem: true });

    // Parse both files using ts-morph
    const existingFile = project.createSourceFile(
        'existing.mjs',
        existingContent,
        { overwrite: true },
    );
    const snippetFile = project.createSourceFile(
        'snippet.mjs',
        snippetWithImports,
        { overwrite: true },
    );

    // Extract imports using ts-morph
    const existingImports = existingFile.getImportDeclarations();
    const snippetImports = snippetFile.getImportDeclarations();
    // Build maps of existing imports: moduleSpecifier -> variableName
    const existingModuleToVariable = new Map<string, string>();
    const existingVariableNames = new Set<string>();

    for (const imp of existingImports) {
        const moduleSpecifier = imp.getModuleSpecifierValue();
        const variableName = getDefaultImportName(imp);

        if (variableName) {
            existingModuleToVariable.set(moduleSpecifier, variableName);
            existingVariableNames.add(variableName);
        }
    }

    // Build map of snippet imports to determine variable name replacements
    const variableReplacements = new Map<string, string>();
    const importsToAdd: string[] = [];

    for (const imp of snippetImports) {
        const moduleSpecifier = imp.getModuleSpecifierValue();
        const snippetVariableName = getDefaultImportName(imp);

        if (!snippetVariableName) continue;

        // Check if this module is already imported
        const existingVariableName =
            existingModuleToVariable.get(moduleSpecifier);

        if (existingVariableName) {
            // Module already imported - use existing variable name
            if (existingVariableName !== snippetVariableName) {
                // Need to replace variable references in configs
                variableReplacements.set(
                    snippetVariableName,
                    existingVariableName,
                );
            }
        } else if (
            moduleSpecifier.includes('baseConfig') &&
            existingImports.length > 0
        ) {
            // Skip baseConfig imports if we already have imports (wrong depth)
            // But check if there's already a baseConfig variable
            const hasBaseConfig = Array.from(
                existingModuleToVariable.values(),
            ).some(v => v === 'baseConfig' || v.includes('baseConfig'));
            if (hasBaseConfig) {
                variableReplacements.set(snippetVariableName, 'baseConfig');
            }
        } else if (!existingVariableNames.has(snippetVariableName)) {
            // New import - add it
            importsToAdd.push(imp.getText());
            existingVariableNames.add(snippetVariableName);
        }
    }

    // Add new imports after existing imports
    if (importsToAdd.length > 0) {
        const lastImportIndex =
            existingImports.length > 0
                ? existingImports.at(-1)!.getChildIndex() + 1
                : 0;

        for (const imp of importsToAdd) {
            existingFile.insertStatements(lastImportIndex, imp);
        }
    }

    // Get export default arrays from both files
    const existingArray = existingFile.getFirstDescendantByKind(
        SyntaxKind.ArrayLiteralExpression,
    );
    const snippetArray = snippetFile.getFirstDescendantByKind(
        SyntaxKind.ArrayLiteralExpression,
    );

    if (!existingArray || !snippetArray) {
        // Fallback: write as-is if we can't parse the arrays
        tree.write(configPath, snippetWithImports);

        return;
    }

    // Collect existing config texts for duplicate checking
    // Track both the text and the actual array index
    const existingConfigs: Array<{ text: string; index: number }> = [];
    const allElements = existingArray.getElements();

    for (let index = 0; index < allElements.length; index++) {
        if (
            allElements[index].getKind() === SyntaxKind.ObjectLiteralExpression
        ) {
            existingConfigs.push({
                text: allElements[index].getText(),
                index: index,
            });
        }
    }

    // Add config objects from snippet (skip spread elements, merge duplicates)
    for (const element of snippetArray.getElements()) {
        // Only process object literals (skip spread elements like ...baseConfig)
        if (element.getKind() === SyntaxKind.ObjectLiteralExpression) {
            let configText = element.getText();

            // Replace variable names to match existing imports
            for (const [
                oldVariable,
                newVariable,
            ] of variableReplacements.entries()) {
                // Replace variable references (word boundaries to avoid partial matches)
                const regex = new RegExp(`\\b${oldVariable}\\b`, 'g');

                configText = configText.replace(regex, newVariable);
            }

            // Check if this config is a duplicate of any existing config
            const duplicateEntry = existingConfigs.find(entry =>
                areConfigsDuplicate(entry.text, configText),
            );

            if (duplicateEntry) {
                // Merge with existing duplicate config
                const mergedConfig = mergeConfigObjects(
                    duplicateEntry.text,
                    configText,
                );
                // Replace the existing config in the array
                const arrayElements = existingArray.getElements();

                arrayElements[duplicateEntry.index].replaceWithText(
                    mergedConfig,
                );
                // Update the tracking entry
                duplicateEntry.text = mergedConfig;
            } else {
                // Add new config if not a duplicate
                const newIndex = existingArray.getElements().length;

                existingArray.addElement(configText);
                // Add to list to prevent duplicates within the snippet itself
                existingConfigs.push({ text: configText, index: newIndex });
            }
        }
    }

    // Post-process: merge any duplicates that exist within the array
    // Later configs should override earlier ones
    let hasChanges = true;

    while (hasChanges) {
        hasChanges = false;
        const arrayElements = existingArray.getElements();

        for (let index = 0; index < arrayElements.length; index++) {
            if (
                arrayElements[index].getKind() !==
                SyntaxKind.ObjectLiteralExpression
            )
                continue;

            const config1 = arrayElements[index].getText();

            // Look for duplicates after this index
            for (
                let index_ = index + 1;
                index_ < arrayElements.length;
                index_++
            ) {
                if (
                    arrayElements[index_].getKind() !==
                    SyntaxKind.ObjectLiteralExpression
                )
                    continue;

                const config2 = arrayElements[index_].getText();

                if (areConfigsDuplicate(config1, config2)) {
                    // Merge config1 into config2 (config2 wins since it comes later)
                    const mergedConfig = mergeConfigObjects(config1, config2);

                    arrayElements[index_].replaceWithText(mergedConfig);
                    // Remove the earlier duplicate
                    existingArray.removeElement(index);
                    hasChanges = true;
                    break; // Break inner loop to refresh array elements
                }
            }

            if (hasChanges) break; // Break outer loop to refresh array elements
        }
    }

    // Write the merged config
    tree.write(configPath, existingFile.getFullText());
}

/**
 * Merge flat config objects by appending override to base config array
 * If a config with matching 'files' or 'name' exists, it will be merged/replaced
 * @param baseConfig - Base config content (full file with export default)
 * @param overrideConfig - Config object or array to append (without export)
 * @returns Merged config content
 */
export function mergeFlatConfigs(
    baseConfig: string,
    overrideConfig: string,
): string {
    const project = new Project({ useInMemoryFileSystem: true });

    const sourceFile = project.createSourceFile(
        'temp-eslint.config.ts',
        baseConfig,
    );

    // Find the default export array
    const exportAssignment = sourceFile.getFirstDescendantByKind(
        SyntaxKind.ExportAssignment,
    );

    if (!exportAssignment) {
        throw new Error(
            'Could not find export default statement in base config',
        );
    }

    const arrayExpression = exportAssignment.getFirstDescendantByKind(
        SyntaxKind.ArrayLiteralExpression,
    );

    if (!arrayExpression) {
        throw new Error('Export default is not an array');
    }

    // Parse override config - it could be a single object or array elements
    const trimmedOverride = overrideConfig.trim();
    const isArrayElement = !trimmedOverride.startsWith('[');

    // Parse the override to extract its properties
    const overrideElements = isArrayElement
        ? [trimmedOverride]
        : trimmedOverride
              .slice(1, -1)
              .split(/,\s*(?![^{]*})/)
              .filter(element => element.trim());

    for (const overrideElement of overrideElements) {
        const trimmedElement = overrideElement.trim();

        if (!trimmedElement) continue;

        // Extract name or files pattern from the override element
        const nameMatch = trimmedElement.match(/name:\s*['"]([^'"]+)['"]/)?.[1];

        const filesMatch = trimmedElement.match(
            /files:\s*(\[[^\]]+\]|['"][^'"]+['"])/,
        )?.[1];

        let merged = false;

        if (nameMatch || filesMatch) {
            // Check if a config with matching name or files already exists
            const existingElements = arrayExpression.getElements();

            for (let index = 0; index < existingElements.length; index++) {
                const element = existingElements[index];
                const elementText = element.getText();

                // Check for matching name
                const existingName = elementText.match(
                    /name:\s*['"]([^'"]+)['"]/,
                )?.[1];
                const existingFiles = elementText.match(
                    /files:\s*(\[[^\]]+\]|['"][^'"]+['"])/,
                )?.[1];

                // If name matches, replace the entire config (name is unique identifier)
                if (nameMatch && existingName === nameMatch) {
                    element.replaceWithText(trimmedElement);
                    merged = true;
                    break;
                }

                // If files pattern matches, merge the configs
                if (filesMatch && existingFiles === filesMatch) {
                    const mergedConfig = mergeConfigObjects(
                        elementText,
                        trimmedElement,
                    );

                    element.replaceWithText(mergedConfig);
                    merged = true;
                    break;
                }
            }
        }

        // If no match found, append the new config
        if (!merged) {
            arrayExpression.addElement(trimmedElement);
        }
    }

    return sourceFile.getFullText();
}
