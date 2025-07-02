## 2.0.9-alpha.1 (2025-07-02)

This was a version bump only for common-core to align it with other projects, there were no code changes.

## 2.0.9-alpha.0 (2025-07-02)

### 🚀 Features

- **common-core:** remove unecessary arguments ([4431760326](https://github.com/Ensono/stacks-nx-plugins/commit/4431760326))
- **root:** add publish command ([47ac1e7566](https://github.com/Ensono/stacks-nx-plugins/commit/47ac1e7566))
- **root:** setup verdaccio local-registry ([91eea08a21](https://github.com/Ensono/stacks-nx-plugins/commit/91eea08a21))
- **next:** update next-auth package along with unit tests to version 5 beta ([3ca259d2da](https://github.com/Ensono/stacks-nx-plugins/commit/3ca259d2da))
- **root:** upgrade nx & next to latest version ([d8183699df](https://github.com/Ensono/stacks-nx-plugins/commit/d8183699df))
- ⚠️  **common-core:** update readme ([836a47e432](https://github.com/Ensono/stacks-nx-plugins/commit/836a47e432))
- more logs for script executions, remove react from create options ([4fd78029a0](https://github.com/Ensono/stacks-nx-plugins/commit/4fd78029a0))
- **common-core:** add util to check nx version used for create script ([eb6ca42aa8](https://github.com/Ensono/stacks-nx-plugins/commit/eb6ca42aa8))
- **rest-client:** add orval commands to generator ([afbf4f45de](https://github.com/Ensono/stacks-nx-plugins/commit/afbf4f45de))
- **common-core:** split nx json stacks into config and executedGenerators ([8382fa3147](https://github.com/Ensono/stacks-nx-plugins/commit/8382fa3147))
- **common-core:** update hasGeneratorExecuted utils to accept optional flag to re-run gen ([96536910fe](https://github.com/Ensono/stacks-nx-plugins/commit/96536910fe))
- **next:** adds common utils to check existing generator executions and updates next ([85876ee073](https://github.com/Ensono/stacks-nx-plugins/commit/85876ee073))
- **next:** refactors plugin to split frontend and infra code into separate generators ([b29baf461e](https://github.com/Ensono/stacks-nx-plugins/commit/b29baf461e))
- **common-core:** allow generating .env.local at root of the workspace. ([faabe71068](https://github.com/Ensono/stacks-nx-plugins/commit/faabe71068))
- **common-core:** allow generating .env.local at root of the workspace. ([0f84a867b0](https://github.com/Ensono/stacks-nx-plugins/commit/0f84a867b0))
- **common-core:** add warnDirectoryProjectName() function ([096558e977](https://github.com/Ensono/stacks-nx-plugins/commit/096558e977))
- **common-core:** add createOrUpdateLocalEnv function ([cca6bfb764](https://github.com/Ensono/stacks-nx-plugins/commit/cca6bfb764))
- **next:** add core infrastructure code changes ([dfbd1bd5b2](https://github.com/Ensono/stacks-nx-plugins/commit/dfbd1bd5b2))
- **common-core:** add copyFiles() function. ([8ff1a84c35](https://github.com/Ensono/stacks-nx-plugins/commit/8ff1a84c35))
- **common-core:** add reusable normalizeOptions function ([e8e9956d6e](https://github.com/Ensono/stacks-nx-plugins/commit/e8e9956d6e))
- **next:** add prettier ignore entry for helm yaml files used for infrastructure ([4a505fa1cc](https://github.com/Ensono/stacks-nx-plugins/commit/4a505fa1cc))
- **common-core:** add prerelease ([b280fc63a9](https://github.com/Ensono/stacks-nx-plugins/commit/b280fc63a9))
- **common-core:** adds ability to deep merge configs ([644a7b7fba](https://github.com/Ensono/stacks-nx-plugins/commit/644a7b7fba))
- **common-core:** update core and next plugins to merge test config rather than overwrite ([#5327](https://github.com/Ensono/stacks-nx-plugins/issues/5327))
- **core:** throw a specific StacksConfigError if cannot read nx.json#stacks to be able to handle it specifically ([e09bee9730](https://github.com/Ensono/stacks-nx-plugins/commit/e09bee9730))
- **common-core:** add registry utility ([e763c7048a](https://github.com/Ensono/stacks-nx-plugins/commit/e763c7048a))
- **common-core:** add utlitity to read stacks config ([ceb64e96ba](https://github.com/Ensono/stacks-nx-plugins/commit/ceb64e96ba))
- **common-core:** add gitignore utility ([d56188c73d](https://github.com/Ensono/stacks-nx-plugins/commit/d56188c73d))
- **common-core:** remove tsquery and move eslint utils ([074890be14](https://github.com/Ensono/stacks-nx-plugins/commit/074890be14))
- **next:** add next-auth generator ([f8e15bcdb4](https://github.com/Ensono/stacks-nx-plugins/commit/f8e15bcdb4))
- **common-e2e:** add E2E executor ([6d96a09936](https://github.com/Ensono/stacks-nx-plugins/commit/6d96a09936))
- **common-core:** add core library ([80dc84c03a](https://github.com/Ensono/stacks-nx-plugins/commit/80dc84c03a))

### 🩹 Fixes

- **root:** use atomic push ([22c4e367bf](https://github.com/Ensono/stacks-nx-plugins/commit/22c4e367bf))
- **common-core:** clean dependency ([f94b8bbbb2](https://github.com/Ensono/stacks-nx-plugins/commit/f94b8bbbb2))
- **common-core:** dependency ([d679cb4414](https://github.com/Ensono/stacks-nx-plugins/commit/d679cb4414))
- **root:** push to git with tag after dependency fix ([3ebbde6bc1](https://github.com/Ensono/stacks-nx-plugins/commit/3ebbde6bc1))
- **root:** use bash for prepare-commit-msg hook script ([155417b692](https://github.com/Ensono/stacks-nx-plugins/commit/155417b692))
- **root:** version dependencies with nx dependency check ([7b80b9e99b](https://github.com/Ensono/stacks-nx-plugins/commit/7b80b9e99b))
- **workspace:** add dependency check ([c49eb223c5](https://github.com/Ensono/stacks-nx-plugins/commit/c49eb223c5))
- **common-core:** add dependency check ([f66897b1f8](https://github.com/Ensono/stacks-nx-plugins/commit/f66897b1f8))
- **common-core:** update lint command ([7150bbaa7b](https://github.com/Ensono/stacks-nx-plugins/commit/7150bbaa7b))
- **root:** revert versions ([3764b72861](https://github.com/Ensono/stacks-nx-plugins/commit/3764b72861))
- **cypress:** disable cypress e2e ([9a3bc92766](https://github.com/Ensono/stacks-nx-plugins/commit/9a3bc92766))
- **next:** set src directory correctly for react-auth & react-query ([bd6071f498](https://github.com/Ensono/stacks-nx-plugins/commit/bd6071f498))
- **root:** add skipCommit & set push to false in local-release targets ([50d618f1a8](https://github.com/Ensono/stacks-nx-plugins/commit/50d618f1a8))
- **root:** lintFilePatterns in project.json ([8c809bcbe3](https://github.com/Ensono/stacks-nx-plugins/commit/8c809bcbe3))
- use app router and fix unit tests ([7d0fe709fd](https://github.com/Ensono/stacks-nx-plugins/commit/7d0fe709fd))
- **workspace:** bump up the dep versions ([23adf42102](https://github.com/Ensono/stacks-nx-plugins/commit/23adf42102))
- **common-core:** update nx versions ([c15d068bd5](https://github.com/Ensono/stacks-nx-plugins/commit/c15d068bd5))
- **root:** readd lintFilePatterns to project.json ([97242ec1e3](https://github.com/Ensono/stacks-nx-plugins/commit/97242ec1e3))
- temp hardcode npm scope ([cbb7b7c890](https://github.com/Ensono/stacks-nx-plugins/commit/cbb7b7c890))
- **root:** changed normizining option in the hope it fixes the async exec path ([60c626f8ea](https://github.com/Ensono/stacks-nx-plugins/commit/60c626f8ea))
- **root:** eslint prettier update ([61a85077a1](https://github.com/Ensono/stacks-nx-plugins/commit/61a85077a1))
- **common-core:** use getNpmScope function to get correct scope ([2dff55e330](https://github.com/Ensono/stacks-nx-plugins/commit/2dff55e330))
- **common-core:** read package json scope name for executed workspace ([333b91f319](https://github.com/Ensono/stacks-nx-plugins/commit/333b91f319))
- linting issues ([c83aa226b1](https://github.com/Ensono/stacks-nx-plugins/commit/c83aa226b1))
- **next:** comment out next-auth-redis related test in e2e ([c5d71a2aed](https://github.com/Ensono/stacks-nx-plugins/commit/c5d71a2aed))
- **root:** upgrade and set nx to v16.4.0 ([6cd3d2b0c0](https://github.com/Ensono/stacks-nx-plugins/commit/6cd3d2b0c0))
- **root:** update all jest configs ([7bad354873](https://github.com/Ensono/stacks-nx-plugins/commit/7bad354873))
- **common-core:** update logic of findFile util ([d12cd99e38](https://github.com/Ensono/stacks-nx-plugins/commit/d12cd99e38))
- **create:** add common util findFile to check for nx.json for handling non monorepo ([5dbbc87c97](https://github.com/Ensono/stacks-nx-plugins/commit/5dbbc87c97))
- **root:** root and common set tslib dep to ^2.5.0 ([33b3be5e72](https://github.com/Ensono/stacks-nx-plugins/commit/33b3be5e72))
- **common-core:** set tslib dep to ^2.3.0 matching other plugins and use cases ([8934b5c990](https://github.com/Ensono/stacks-nx-plugins/commit/8934b5c990))
- **common-core:** remove unnecessary async await from checkNxVersion ([24ca63ff1a](https://github.com/Ensono/stacks-nx-plugins/commit/24ca63ff1a))
- **root:** set nx nrwl packages to 15.7.2 ([742375d930](https://github.com/Ensono/stacks-nx-plugins/commit/742375d930))
- **root:** set nx nrwl packages to 15.9.4 and scope to 15.x ([7ee035aada](https://github.com/Ensono/stacks-nx-plugins/commit/7ee035aada))
- **root:** set nrwl packaeg versions to ^15.7.2 ([24dce1b0d2](https://github.com/Ensono/stacks-nx-plugins/commit/24dce1b0d2))
- **root:** set nrwl peerDeps to v15 major scope ([3240016eeb](https://github.com/Ensono/stacks-nx-plugins/commit/3240016eeb))
- **next:** update unit test ([5375cb18af](https://github.com/Ensono/stacks-nx-plugins/commit/5375cb18af))
- **common-core:** add option to check project generator as well ([46e7495a80](https://github.com/Ensono/stacks-nx-plugins/commit/46e7495a80))
- **common-core:** add checks for workspace init pre req for deployment generators ([8094154f5b](https://github.com/Ensono/stacks-nx-plugins/commit/8094154f5b))
- **root:** pass executedGenerators prop to readStacksConfig ([eca691ff3d](https://github.com/Ensono/stacks-nx-plugins/commit/eca691ff3d))
- **common-core:** don't throw error in deploymentMessage function when stacks config is missing ([5b15969c20](https://github.com/Ensono/stacks-nx-plugins/commit/5b15969c20))
- **rest-client:** linting and generator config"" ([b8966fc2d4](https://github.com/Ensono/stacks-nx-plugins/commit/b8966fc2d4))
- **rest-client:** linting and generator config" ([aaa1f76b7f](https://github.com/Ensono/stacks-nx-plugins/commit/aaa1f76b7f))
- **rest-client:** update schema to read project list and revert normalize options replace ([afaf0c9b2b](https://github.com/Ensono/stacks-nx-plugins/commit/afaf0c9b2b))
- **common-core:** refactor project name string replace normalize ([46ad1440b7](https://github.com/Ensono/stacks-nx-plugins/commit/46ad1440b7))
- **rest-client:** fixes linting and format windows directory slash to dash ([1b63a399f8](https://github.com/Ensono/stacks-nx-plugins/commit/1b63a399f8))
- **common-core:** follow nx approach of removing apps, libs and packages from --directory option when generating libraries ([cea2ce8a3d](https://github.com/Ensono/stacks-nx-plugins/commit/cea2ce8a3d))
- **common-core:** getResourceGroup returns hyphenated value ([4ce2dc4511](https://github.com/Ensono/stacks-nx-plugins/commit/4ce2dc4511))
- **core:** prevent duplicated ignore entries ([65aa6cf1b4](https://github.com/Ensono/stacks-nx-plugins/commit/65aa6cf1b4))
- **azure-node:** add warning to amend nrwl generated file ([876fcd33d6](https://github.com/Ensono/stacks-nx-plugins/commit/876fcd33d6))
- **common-core:** linting issues ([a73e5458b2](https://github.com/Ensono/stacks-nx-plugins/commit/a73e5458b2))
- **logger:** add code coverage and eslint config ([dd2d632b54](https://github.com/Ensono/stacks-nx-plugins/commit/dd2d632b54))
- **common:** add minimatch dependancy ([a0c8e2777b](https://github.com/Ensono/stacks-nx-plugins/commit/a0c8e2777b))
- **root:** move options back to project.json ([92a708c036](https://github.com/Ensono/stacks-nx-plugins/commit/92a708c036))
- **common-core:** replaced existing eslint merge with common util ([#5423](https://github.com/Ensono/stacks-nx-plugins/issues/5423))
- **next-init:** include files into project tsconfig ([c512ef0be1](https://github.com/Ensono/stacks-nx-plugins/commit/c512ef0be1))
- **next-init-lint:** amend parserOptions to be written into eslint json ([3a77d45b18](https://github.com/Ensono/stacks-nx-plugins/commit/3a77d45b18))
- **root:** add missing type decleration ([bf48970fe7](https://github.com/Ensono/stacks-nx-plugins/commit/bf48970fe7))
- **common-core:** correctly track project dependencies ([fc95585f8a](https://github.com/Ensono/stacks-nx-plugins/commit/fc95585f8a))
- **next:** update dependency to test ([207eb1456f](https://github.com/Ensono/stacks-nx-plugins/commit/207eb1456f))
- **common-e2e:** patch e2e publishing to not conflict with npm packages ([0fa47a512a](https://github.com/Ensono/stacks-nx-plugins/commit/0fa47a512a))
- **create:** add github post target ([dd2fa4b7ab](https://github.com/Ensono/stacks-nx-plugins/commit/dd2fa4b7ab))
- **common-core:** add github post target ([342185aaa3](https://github.com/Ensono/stacks-nx-plugins/commit/342185aaa3))
- **common-core:** version bump ([a3f8f0895a](https://github.com/Ensono/stacks-nx-plugins/commit/a3f8f0895a))
- **create:** skip generating changelog ([17b9cb97d6](https://github.com/Ensono/stacks-nx-plugins/commit/17b9cb97d6))
- **root:** run version as dependant to e2e target ([fe185b2d43](https://github.com/Ensono/stacks-nx-plugins/commit/fe185b2d43))
- **root:** disable push in version target ([485cc24567](https://github.com/Ensono/stacks-nx-plugins/commit/485cc24567))
- **root:** remove release target's postTarget option for manual orchestration ([0e88032539](https://github.com/Ensono/stacks-nx-plugins/commit/0e88032539))
- **root:** disable ngx-deploy-npm from building to manage dependencies building via nx ([c6764257b3](https://github.com/Ensono/stacks-nx-plugins/commit/c6764257b3))
- **root:** remove build step for e2e in favour of version ([961bc58783](https://github.com/Ensono/stacks-nx-plugins/commit/961bc58783))

### ⚠️  Breaking Changes

- **common-core:** release v2

### ❤️ Thank You

- Chris Winch
- Daniel Phillips
- Elliot Evans
- Gareth Cozens
- Isaac Shek
- Karim Hmaissi
- leesaxby @leesaxby
- Matthew Aizlewood
- Metecan Aydin
- MetecanAydin @MetecanAydin
- Michal Palys-Dudek
- Nandor Szentpeteri