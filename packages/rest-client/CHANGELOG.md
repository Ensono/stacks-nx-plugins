## 2.0.9-alpha.3 (2025-07-02)

This was a version bump only for rest-client to align it with other projects, there were no code changes.

## 2.0.9-alpha.2 (2025-07-02)

This was a version bump only for rest-client to align it with other projects, there were no code changes.

## 2.0.9-alpha.1 (2025-07-02)

This was a version bump only for rest-client to align it with other projects, there were no code changes.

## 2.0.9-alpha.0 (2025-07-02)

### 🚀 Features

- **root:** upgrade nx & next to latest version ([d8183699df](https://github.com/Ensono/stacks-nx-plugins/commit/d8183699df))
- ⚠️  **rest-client:** update readme ([70935b3f48](https://github.com/Ensono/stacks-nx-plugins/commit/70935b3f48))
- **rest-client:** add unit test to orval-client ([5d07810423](https://github.com/Ensono/stacks-nx-plugins/commit/5d07810423))
- **rest-client:** add orval commands to generator ([afbf4f45de](https://github.com/Ensono/stacks-nx-plugins/commit/afbf4f45de))
- **rest-client:** add generator to create orval config file inside new nx library ([ed052584ed](https://github.com/Ensono/stacks-nx-plugins/commit/ed052584ed))
- **rest-client:** add openapi-client generator ([097a68e22f](https://github.com/Ensono/stacks-nx-plugins/commit/097a68e22f))
- add missing descriptions to schemas and fix schema ids ([b014b260bb](https://github.com/Ensono/stacks-nx-plugins/commit/b014b260bb))
- **rest-client:** use types from http-client rather than axios directly. ([7d9fba4cd0](https://github.com/Ensono/stacks-nx-plugins/commit/7d9fba4cd0))
- **rest-client:** use types from http-client rather than axios directly. ([942e416742](https://github.com/Ensono/stacks-nx-plugins/commit/942e416742))
- **rest-client:** use types from http-client rather than axios directly. ([ac7f918053](https://github.com/Ensono/stacks-nx-plugins/commit/ac7f918053))
- **rest-client:** don't attach version number to generated function names in client-endpoint ([a85d36c5eb](https://github.com/Ensono/stacks-nx-plugins/commit/a85d36c5eb))
- **rest-client:** add warning about changed project name if --directory option was passed. ([04b180fc39](https://github.com/Ensono/stacks-nx-plugins/commit/04b180fc39))
- **rest-client:** bump-version will now also properly update the generated code to the new version (class names etc) ([eb4a2e5d37](https://github.com/Ensono/stacks-nx-plugins/commit/eb4a2e5d37))
- **rest-client:** redone bump-version generator ([9ec7111b3d](https://github.com/Ensono/stacks-nx-plugins/commit/9ec7111b3d))
- **rest-client:** generate each client endpoint as a separate library ([e0185473a9](https://github.com/Ensono/stacks-nx-plugins/commit/e0185473a9))
- **rest-client:** add note that if you use the --directory option then the project name will change. ([2d6c78fc9b](https://github.com/Ensono/stacks-nx-plugins/commit/2d6c78fc9b))
- **rest-client:** add prerelease ([42c5cdadc4](https://github.com/Ensono/stacks-nx-plugins/commit/42c5cdadc4))
- **logger-client:** add file generation for logging instance ([dac411daf7](https://github.com/Ensono/stacks-nx-plugins/commit/dac411daf7))
- **rest-client:** add client-endpoint, and bump-version generators ([66e284b0c7](https://github.com/Ensono/stacks-nx-plugins/commit/66e284b0c7))
- **rest-client:** add e2e test using common executor, fix linting ([11fa2d2cad](https://github.com/Ensono/stacks-nx-plugins/commit/11fa2d2cad))
- **rest-client:** add import path to schema ([e0d4a9c76b](https://github.com/Ensono/stacks-nx-plugins/commit/e0d4a9c76b))
- **rest-client:** use nrwl js library generator in http-client ([3142e50498](https://github.com/Ensono/stacks-nx-plugins/commit/3142e50498))
- **rest-client:** create rest-client plugin ([2306b1165f](https://github.com/Ensono/stacks-nx-plugins/commit/2306b1165f))

### 🩹 Fixes

- **root:** bump versions to latest ([e77ce3b271](https://github.com/Ensono/stacks-nx-plugins/commit/e77ce3b271))
- **root:** bump axios and elliptic ([f79b13cb43](https://github.com/Ensono/stacks-nx-plugins/commit/f79b13cb43))
- **rest-client:** updated axios to 1.7.3 ([0e26ed86fc](https://github.com/Ensono/stacks-nx-plugins/commit/0e26ed86fc))
- **root:** use atomic push ([22c4e367bf](https://github.com/Ensono/stacks-nx-plugins/commit/22c4e367bf))
- **root:** update dependencies ([7fa5ed0740](https://github.com/Ensono/stacks-nx-plugins/commit/7fa5ed0740))
- **rest-client:** dependency ([1228be64d2](https://github.com/Ensono/stacks-nx-plugins/commit/1228be64d2))
- **root:** push to git with tag after dependency fix ([3ebbde6bc1](https://github.com/Ensono/stacks-nx-plugins/commit/3ebbde6bc1))
- **root:** version dependencies with nx dependency check ([7b80b9e99b](https://github.com/Ensono/stacks-nx-plugins/commit/7b80b9e99b))
- **rest-client:** add dependency check ([fa52a39cc5](https://github.com/Ensono/stacks-nx-plugins/commit/fa52a39cc5))
- **rest-client:** update usage from core ([eeb7fc1225](https://github.com/Ensono/stacks-nx-plugins/commit/eeb7fc1225))
- **rest-client:** update bump-version generator ([b9bc41ae42](https://github.com/Ensono/stacks-nx-plugins/commit/b9bc41ae42))
- **rest-client:** update client generator for nx upgrade ([e6dcf7730d](https://github.com/Ensono/stacks-nx-plugins/commit/e6dcf7730d))
- **root:** revert versions ([3764b72861](https://github.com/Ensono/stacks-nx-plugins/commit/3764b72861))
- **cypress:** disable cypress e2e ([9a3bc92766](https://github.com/Ensono/stacks-nx-plugins/commit/9a3bc92766))
- **rest-client:** fix the bump version function ([c82e4ca00e](https://github.com/Ensono/stacks-nx-plugins/commit/c82e4ca00e))
- **root:** add skipCommit & set push to false in local-release targets ([50d618f1a8](https://github.com/Ensono/stacks-nx-plugins/commit/50d618f1a8))
- **next:** storybook generator and fix rest-client unit tests and bump packages up in workspace ([fba18a1580](https://github.com/Ensono/stacks-nx-plugins/commit/fba18a1580))
- **workspace:** bump up the dep versions ([23adf42102](https://github.com/Ensono/stacks-nx-plugins/commit/23adf42102))
- **root:** readd lintFilePatterns to project.json ([97242ec1e3](https://github.com/Ensono/stacks-nx-plugins/commit/97242ec1e3))
- **rest-client:** removed console logs ([eba871160e](https://github.com/Ensono/stacks-nx-plugins/commit/eba871160e))
- **rest-client:** changed regex to fix issues ([ec8e6d9648](https://github.com/Ensono/stacks-nx-plugins/commit/ec8e6d9648))
- **rest-client:** added additional folder name checks ([5dc3a97471](https://github.com/Ensono/stacks-nx-plugins/commit/5dc3a97471))
- **rest-client:** added additional folder name checks ([3e13dfc2aa](https://github.com/Ensono/stacks-nx-plugins/commit/3e13dfc2aa))
- update rest client snapshot ([f92790832a](https://github.com/Ensono/stacks-nx-plugins/commit/f92790832a))
- use runTarget instead ([15700e234b](https://github.com/Ensono/stacks-nx-plugins/commit/15700e234b))
- **workspace:** bump msw version to avoid ts peer dep conflict ([1f2ba8ebe2](https://github.com/Ensono/stacks-nx-plugins/commit/1f2ba8ebe2))
- **rest-client:** update peerDeps to nx v16 ([f8c69eaa08](https://github.com/Ensono/stacks-nx-plugins/commit/f8c69eaa08))
- **root:** update all jest configs ([7bad354873](https://github.com/Ensono/stacks-nx-plugins/commit/7bad354873))
- **rest-client:** add generated client to eslintignore ([540f4bdabb](https://github.com/Ensono/stacks-nx-plugins/commit/540f4bdabb))
- **rest-client:** add pattern for openapi schema option ([a1d621366f](https://github.com/Ensono/stacks-nx-plugins/commit/a1d621366f))
- **rest-client:** change file check method to nx tree.isFile ([361b7394ed](https://github.com/Ensono/stacks-nx-plugins/commit/361b7394ed))
- **rest-client:** fix various misc bugs with openapi-client ([21e2b5b45f](https://github.com/Ensono/stacks-nx-plugins/commit/21e2b5b45f))
- **root:** add nx version ^15.7.2 as peerDep for each plugin ([dc75614b19](https://github.com/Ensono/stacks-nx-plugins/commit/dc75614b19))
- **root:** set nx nrwl packages to 15.7.2 ([742375d930](https://github.com/Ensono/stacks-nx-plugins/commit/742375d930))
- **root:** set nx nrwl packages to 15.9.4 and scope to 15.x ([7ee035aada](https://github.com/Ensono/stacks-nx-plugins/commit/7ee035aada))
- **root:** set nrwl packaeg versions to ^15.7.2 ([24dce1b0d2](https://github.com/Ensono/stacks-nx-plugins/commit/24dce1b0d2))
- **root:** set nrwl peerDeps to v15 major scope ([3240016eeb](https://github.com/Ensono/stacks-nx-plugins/commit/3240016eeb))
- **rest-client:** minor fixes in openapi-client generator ([1a4c0cdc37](https://github.com/Ensono/stacks-nx-plugins/commit/1a4c0cdc37))
- **rest-client:** update axios to latest version ([5a5fa1fc46](https://github.com/Ensono/stacks-nx-plugins/commit/5a5fa1fc46))
- **rest-client:** linting and generator config"" ([b8966fc2d4](https://github.com/Ensono/stacks-nx-plugins/commit/b8966fc2d4))
- **rest-client:** linting and generator config" ([aaa1f76b7f](https://github.com/Ensono/stacks-nx-plugins/commit/aaa1f76b7f))
- **rest-client:** update schema to read project list and revert normalize options replace ([afaf0c9b2b](https://github.com/Ensono/stacks-nx-plugins/commit/afaf0c9b2b))
- **rest-client:** refactor and update unit tests ([1bfef6e386](https://github.com/Ensono/stacks-nx-plugins/commit/1bfef6e386))
- **rest-client:** enable bump version to work with selecting list of available projects ([04b5e26171](https://github.com/Ensono/stacks-nx-plugins/commit/04b5e26171))
- **rest-client:** add type error if specified project is not acceptable to version ([6ac0e362b4](https://github.com/Ensono/stacks-nx-plugins/commit/6ac0e362b4))
- **rest-client:** fixes linting and format windows directory slash to dash ([1b63a399f8](https://github.com/Ensono/stacks-nx-plugins/commit/1b63a399f8))
- **rest-client:** fix bump-version generator schema ([e94c7e9ba9](https://github.com/Ensono/stacks-nx-plugins/commit/e94c7e9ba9))
- **rest-client:** remove version from type interfaces ([48e867a9e0](https://github.com/Ensono/stacks-nx-plugins/commit/48e867a9e0))
- **rest-client:** create .env.local file instead of .env ([bbbf3e2673](https://github.com/Ensono/stacks-nx-plugins/commit/bbbf3e2673))
- **rest-client:** env var validation. in client-endpoint generator ([6acf9efe44](https://github.com/Ensono/stacks-nx-plugins/commit/6acf9efe44))
- **rest-client:** create .env.local file instead of .env ([f7f683a516](https://github.com/Ensono/stacks-nx-plugins/commit/f7f683a516))
- **rest-client:** fix some options validation ([640a954622](https://github.com/Ensono/stacks-nx-plugins/commit/640a954622))
- **rest-client:** fix some options validation ([844b53abc4](https://github.com/Ensono/stacks-nx-plugins/commit/844b53abc4))
- **rest-client:** fix some options validation ([608aa36cbf](https://github.com/Ensono/stacks-nx-plugins/commit/608aa36cbf))
- **rest-client:** client-endpoint test params were wrong ([e8c9328059](https://github.com/Ensono/stacks-nx-plugins/commit/e8c9328059))
- **rest-client:** validate http methods passed to client-endpoint generator. ([300eb26320](https://github.com/Ensono/stacks-nx-plugins/commit/300eb26320))
- **rest-client:** add missing validation for options ([accdd51e61](https://github.com/Ensono/stacks-nx-plugins/commit/accdd51e61))
- **rest-client:** bump version in all endpoint files, not only in src/ ([aa874ba6e4](https://github.com/Ensono/stacks-nx-plugins/commit/aa874ba6e4))
- **rest-client:** add ci coverage config ([9f823f364b](https://github.com/Ensono/stacks-nx-plugins/commit/9f823f364b))
- **rest-client:** --importPath validation. ([426136d379](https://github.com/Ensono/stacks-nx-plugins/commit/426136d379))
- **rest-client:** cannot use -d as its reserved for --dry-run ([7a6bbc87ef](https://github.com/Ensono/stacks-nx-plugins/commit/7a6bbc87ef))
- **rest-client:** error message tweak ([55c4f54f65](https://github.com/Ensono/stacks-nx-plugins/commit/55c4f54f65))
- **rest-client:** handle empty endpoint version from prompt in bump-version generator ([ea43817d96](https://github.com/Ensono/stacks-nx-plugins/commit/ea43817d96))
- **rest-client:** add missing "v" in version of URL ([25217d0e02](https://github.com/Ensono/stacks-nx-plugins/commit/25217d0e02))
- **rest-client:** option alias should be single char ([42f6e09bb8](https://github.com/Ensono/stacks-nx-plugins/commit/42f6e09bb8))
- **rest-client:** option alias should be single char ([601f95937f](https://github.com/Ensono/stacks-nx-plugins/commit/601f95937f))
- **rest-client:** fix generated code ([54e5f986a4](https://github.com/Ensono/stacks-nx-plugins/commit/54e5f986a4))
- **rest-client:** options descriptions ([cf338ec54e](https://github.com/Ensono/stacks-nx-plugins/commit/cf338ec54e))
- **rest-client:** eslint on generated file ([7fb92cbc72](https://github.com/Ensono/stacks-nx-plugins/commit/7fb92cbc72))
- **rest-client:** Remove unused option. ([560d74b9d6](https://github.com/Ensono/stacks-nx-plugins/commit/560d74b9d6))
- **root:** move options back to project.json ([92a708c036](https://github.com/Ensono/stacks-nx-plugins/commit/92a708c036))
- **root:** add missing type decleration ([bf48970fe7](https://github.com/Ensono/stacks-nx-plugins/commit/bf48970fe7))
- **common-e2e:** patch e2e publishing to not conflict with npm packages ([0fa47a512a](https://github.com/Ensono/stacks-nx-plugins/commit/0fa47a512a))
- **rest-client:** add github post target ([b1b9b38b6d](https://github.com/Ensono/stacks-nx-plugins/commit/b1b9b38b6d))
- **rest-client:** version bump ([a7af1dd2ca](https://github.com/Ensono/stacks-nx-plugins/commit/a7af1dd2ca))
- **rest-client:** remove __dirname to search for files in the project root, fix unit tests ([c6c9e59caf](https://github.com/Ensono/stacks-nx-plugins/commit/c6c9e59caf))
- **rest-client:** remove comments from cleanup ([6e86102b29](https://github.com/Ensono/stacks-nx-plugins/commit/6e86102b29))
- **create:** skip generating changelog ([17b9cb97d6](https://github.com/Ensono/stacks-nx-plugins/commit/17b9cb97d6))
- **root:** run version as dependant to e2e target ([fe185b2d43](https://github.com/Ensono/stacks-nx-plugins/commit/fe185b2d43))
- **rest-client:** skip changelog generation for semver in rest-client ([ffac36343c](https://github.com/Ensono/stacks-nx-plugins/commit/ffac36343c))
- **rest-client:** add missing config to package.json and project.json ([314c42fc3a](https://github.com/Ensono/stacks-nx-plugins/commit/314c42fc3a))
- **rest-client:** remove changelog.md from local version run ([b0852465cb](https://github.com/Ensono/stacks-nx-plugins/commit/b0852465cb))

### ⚠️  Breaking Changes

- **rest-client:** release v2

### ❤️ Thank You

- Chris Winch
- Daniel Phillips
- Elliot Evans
- Gareth Cozens
- Isaac Shek
- leesaxby @leesaxby
- MarkComerford
- Matthew Aizlewood
- Metecan Aydin
- MetecanAydin @MetecanAydin
- Michal Palys-Dudek
- Nandor Szentpeteri
- Richard Slater