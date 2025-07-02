# 3.0.0 (2025-07-02)

This was a version bump only for create to align it with other projects, there were no code changes.

## 2.0.9-alpha.4 (2025-07-02)

### 🩹 Fixes

- **workspace:** ensure all packages have provenance support ([239d311](https://github.com/Ensono/stacks-nx-plugins/commit/239d311))

### ❤️ Thank You

- Gareth Cozens

## 2.0.9-alpha.3 (2025-07-02)

This was a version bump only for create to align it with other projects, there were no code changes.

## 2.0.9-alpha.2 (2025-07-02)

This was a version bump only for create to align it with other projects, there were no code changes.

## 2.0.9-alpha.1 (2025-07-02)

This was a version bump only for create to align it with other projects, there were no code changes.

## 2.0.9-alpha.0 (2025-07-02)

### 🚀 Features

- **create:** improve directory flag behaviour ([7d17447563](https://github.com/Ensono/stacks-nx-plugins/commit/7d17447563))
- **root:** setup verdaccio local-registry ([91eea08a21](https://github.com/Ensono/stacks-nx-plugins/commit/91eea08a21))
- **create:** versionedPackages - revert  ../dist ([3f9faa5a32](https://github.com/Ensono/stacks-nx-plugins/commit/3f9faa5a32))
- **root:** upgrade nx & next to latest version ([d8183699df](https://github.com/Ensono/stacks-nx-plugins/commit/d8183699df))
- ⚠️  **create:** update readme ([e12d405cfc](https://github.com/Ensono/stacks-nx-plugins/commit/e12d405cfc))
- more logs for script executions, remove react from create options ([4fd78029a0](https://github.com/Ensono/stacks-nx-plugins/commit/4fd78029a0))
- **common-core:** add util to check nx version used for create script ([eb6ca42aa8](https://github.com/Ensono/stacks-nx-plugins/commit/eb6ca42aa8))
- **rest-client:** add unit test to orval-client ([5d07810423](https://github.com/Ensono/stacks-nx-plugins/commit/5d07810423))
- **rest-client:** add orval commands to generator ([afbf4f45de](https://github.com/Ensono/stacks-nx-plugins/commit/afbf4f45de))
- **common-core:** split nx json stacks into config and executedGenerators ([8382fa3147](https://github.com/Ensono/stacks-nx-plugins/commit/8382fa3147))
- **create:** add --useDev flag to create script ([a180c225d5](https://github.com/Ensono/stacks-nx-plugins/commit/a180c225d5))
- **playwright:** integrate playwright init script with the create script ([6d14be6a7c](https://github.com/Ensono/stacks-nx-plugins/commit/6d14be6a7c))
- **create:** add prerelease ([1557b8a39b](https://github.com/Ensono/stacks-nx-plugins/commit/1557b8a39b))
- **create:** add support for custom dir and overwrite ([c532ecc95a](https://github.com/Ensono/stacks-nx-plugins/commit/c532ecc95a))
- **create:** use apps preset for Next (WIP) ([50fecb400a](https://github.com/Ensono/stacks-nx-plugins/commit/50fecb400a))
- **create:** enable e2e executor with create script ([008ebab2b2](https://github.com/Ensono/stacks-nx-plugins/commit/008ebab2b2))
- **create:** support stacks options and write to nx ([e044b7edbd](https://github.com/Ensono/stacks-nx-plugins/commit/e044b7edbd))
- **create:** add next support for preset ([ae3429c9ca](https://github.com/Ensono/stacks-nx-plugins/commit/ae3429c9ca))
- **create:** use renamed workspace init generator ([24232207cf](https://github.com/Ensono/stacks-nx-plugins/commit/24232207cf))
- **create:** use renamed workspace init generator ([eb8590b45f](https://github.com/Ensono/stacks-nx-plugins/commit/eb8590b45f))
- **create:** add e2e test ([39a88ab654](https://github.com/Ensono/stacks-nx-plugins/commit/39a88ab654))
- **create:** npx from local registry ([c205ef165d](https://github.com/Ensono/stacks-nx-plugins/commit/c205ef165d))
- **create:** add create-stacks-workspace package ([46c00e813a](https://github.com/Ensono/stacks-nx-plugins/commit/46c00e813a))

### 🩹 Fixes

- **cypress:** add deprecation notice ([6b222a52d5](https://github.com/Ensono/stacks-nx-plugins/commit/6b222a52d5))
- **root:** bump versions to latest ([e77ce3b271](https://github.com/Ensono/stacks-nx-plugins/commit/e77ce3b271))
- **create:** exclude nx cache folder from copy ([2ae569e225](https://github.com/Ensono/stacks-nx-plugins/commit/2ae569e225))
- **root:** use atomic push ([22c4e367bf](https://github.com/Ensono/stacks-nx-plugins/commit/22c4e367bf))
- **root:** update dependencies ([7fa5ed0740](https://github.com/Ensono/stacks-nx-plugins/commit/7fa5ed0740))
- **create:** dependency ([baced6a0cc](https://github.com/Ensono/stacks-nx-plugins/commit/baced6a0cc))
- **root:** correct version ([c142990475](https://github.com/Ensono/stacks-nx-plugins/commit/c142990475))
- **root:** push to git with tag after dependency fix ([3ebbde6bc1](https://github.com/Ensono/stacks-nx-plugins/commit/3ebbde6bc1))
- **root:** version dependencies with nx dependency check ([7b80b9e99b](https://github.com/Ensono/stacks-nx-plugins/commit/7b80b9e99b))
- **common-core:** add dependency check ([8d2172b7e9](https://github.com/Ensono/stacks-nx-plugins/commit/8d2172b7e9))
- **create:** recursively remove on overwrite ([44a28ed712](https://github.com/Ensono/stacks-nx-plugins/commit/44a28ed712))
- **create:** attempt to clone project from tmp if cwd matches target ([2a0b764b8a](https://github.com/Ensono/stacks-nx-plugins/commit/2a0b764b8a))
- **create:** add dependency to package ([8091efd33d](https://github.com/Ensono/stacks-nx-plugins/commit/8091efd33d))
- **create:** stacks-cli remove folder behaviour for windows ([674151fdb5](https://github.com/Ensono/stacks-nx-plugins/commit/674151fdb5))
- **root:** logger implicit dependencies ([db8a447b0a](https://github.com/Ensono/stacks-nx-plugins/commit/db8a447b0a))
- **root:** fix implicit dependencies for e2e apps ([59da897866](https://github.com/Ensono/stacks-nx-plugins/commit/59da897866))
- **create:** throw error only if working directory does not exist ([8269fd31dc](https://github.com/Ensono/stacks-nx-plugins/commit/8269fd31dc))
- **root:** revert versions ([3764b72861](https://github.com/Ensono/stacks-nx-plugins/commit/3764b72861))
- **cypress:** disable cypress e2e ([9a3bc92766](https://github.com/Ensono/stacks-nx-plugins/commit/9a3bc92766))
- **root:** use dev tag for @ensono-stacks/core ([d97f740985](https://github.com/Ensono/stacks-nx-plugins/commit/d97f740985))
- **next:** app dir nesting ([91886d033b](https://github.com/Ensono/stacks-nx-plugins/commit/91886d033b))
- **next:** set src directory correctly for react-auth & react-query ([bd6071f498](https://github.com/Ensono/stacks-nx-plugins/commit/bd6071f498))
- **root:** add skipCommit & set push to false in local-release targets ([50d618f1a8](https://github.com/Ensono/stacks-nx-plugins/commit/50d618f1a8))
- **root:** lintFilePatterns in project.json ([8c809bcbe3](https://github.com/Ensono/stacks-nx-plugins/commit/8c809bcbe3))
- use app router and fix unit tests ([7d0fe709fd](https://github.com/Ensono/stacks-nx-plugins/commit/7d0fe709fd))
- bump node and fix cypress create workspace e2e test ([1894c12c40](https://github.com/Ensono/stacks-nx-plugins/commit/1894c12c40))
- **workspace:** bump up the dep versions ([23adf42102](https://github.com/Ensono/stacks-nx-plugins/commit/23adf42102))
- **root:** readd lintFilePatterns to project.json ([97242ec1e3](https://github.com/Ensono/stacks-nx-plugins/commit/97242ec1e3))
- **root:** skipped e2e test for workspace ([0f7665ecbc](https://github.com/Ensono/stacks-nx-plugins/commit/0f7665ecbc))
- remove unnecessary log message ([3c9817065f](https://github.com/Ensono/stacks-nx-plugins/commit/3c9817065f))
- remove test runner descriptions ([82c712a080](https://github.com/Ensono/stacks-nx-plugins/commit/82c712a080))
- fixes for create stacks workspace ([66864523a2](https://github.com/Ensono/stacks-nx-plugins/commit/66864523a2))
- **create:** update comment for added logic ([2d9751ce1a](https://github.com/Ensono/stacks-nx-plugins/commit/2d9751ce1a))
- **create:** ensure is cypress is also selected we set to none ([babb732f5c](https://github.com/Ensono/stacks-nx-plugins/commit/babb732f5c))
- **create:** add logic to normalise setting e2eTestRunner to none if playwright ([2e458701c1](https://github.com/Ensono/stacks-nx-plugins/commit/2e458701c1))
- **create:** update unit test for dependencies test file ([5437c50f66](https://github.com/Ensono/stacks-nx-plugins/commit/5437c50f66))
- unit test fix in next and create ([f215dac486](https://github.com/Ensono/stacks-nx-plugins/commit/f215dac486))
- **next:** add flag of no appDir for nx/next generator ([1601de1b29](https://github.com/Ensono/stacks-nx-plugins/commit/1601de1b29))
- **root:** updates to create script ([0cb5446e3b](https://github.com/Ensono/stacks-nx-plugins/commit/0cb5446e3b))
- **root:** update all jest configs ([7bad354873](https://github.com/Ensono/stacks-nx-plugins/commit/7bad354873))
- **create:** add common util findFile to check for nx.json for handling non monorepo ([5dbbc87c97](https://github.com/Ensono/stacks-nx-plugins/commit/5dbbc87c97))
- **create:** check test runner is not undefined ([b0b957aa75](https://github.com/Ensono/stacks-nx-plugins/commit/b0b957aa75))
- **create:** add cypress related changes to create script ([be482da8a0](https://github.com/Ensono/stacks-nx-plugins/commit/be482da8a0))
- **create:** lock nrwl package versions to nx version ([be4e6afab1](https://github.com/Ensono/stacks-nx-plugins/commit/be4e6afab1))
- **common-core:** remove unnecessary async await from checkNxVersion ([24ca63ff1a](https://github.com/Ensono/stacks-nx-plugins/commit/24ca63ff1a))
- **root:** set nx nrwl packages to 15.9.4 and scope to 15.x ([7ee035aada](https://github.com/Ensono/stacks-nx-plugins/commit/7ee035aada))
- **create:** only get the dev version of the ensono-stacks plugins ([e7ea7f506f](https://github.com/Ensono/stacks-nx-plugins/commit/e7ea7f506f))
- **playwright:** update project name passed in create script ([a01355e442](https://github.com/Ensono/stacks-nx-plugins/commit/a01355e442))
- **playwright:** refactor playwright init for create script ([8812adcced](https://github.com/Ensono/stacks-nx-plugins/commit/8812adcced))
- **create:** remove create-stacks-workspaces defaults previously added ([4ec6b00792](https://github.com/Ensono/stacks-nx-plugins/commit/4ec6b00792))
- **create:** remove logs ([e0cd981265](https://github.com/Ensono/stacks-nx-plugins/commit/e0cd981265))
- **create:** correct behaviour for usage with dir and overwrite ([2418ac2300](https://github.com/Ensono/stacks-nx-plugins/commit/2418ac2300))
- **create:** check dir name matches project name with overwrite ([de9d8ae1d5](https://github.com/Ensono/stacks-nx-plugins/commit/de9d8ae1d5))
- **root:** move options back to project.json ([92a708c036](https://github.com/Ensono/stacks-nx-plugins/commit/92a708c036))
- **create:** fix handling env vars on Windows when executing commands ([4e14171609](https://github.com/Ensono/stacks-nx-plugins/commit/4e14171609))
- **create:** rename function for switching to apps preset ([7c24adc469](https://github.com/Ensono/stacks-nx-plugins/commit/7c24adc469))
- **create:** skip taskctl pipeline runner if stacks config is missing ([23e98956c1](https://github.com/Ensono/stacks-nx-plugins/commit/23e98956c1))
- **create:** use correct preset for next; correct e2eTestRunner flag ([3df2eb1ac8](https://github.com/Ensono/stacks-nx-plugins/commit/3df2eb1ac8))
- **create:** add vcs defaults ([759415ba29](https://github.com/Ensono/stacks-nx-plugins/commit/759415ba29))
- **create:** don't catch errors from commiting files ([5338b569ba](https://github.com/Ensono/stacks-nx-plugins/commit/5338b569ba))
- **create:** also catch errors in generators. ([7a083747c0](https://github.com/Ensono/stacks-nx-plugins/commit/7a083747c0))
- **create:** rerunning create workspace should not be allowed on existing workspace ([54c21d3949](https://github.com/Ensono/stacks-nx-plugins/commit/54c21d3949))
- **create:** chain generator executors to prevent common file overwrites ([b376d815f6](https://github.com/Ensono/stacks-nx-plugins/commit/b376d815f6))
- **create:** auto commits additional generator files upon workspace creation ([ba0ca14799](https://github.com/Ensono/stacks-nx-plugins/commit/ba0ca14799))
- **root:** add missing type decleration ([bf48970fe7](https://github.com/Ensono/stacks-nx-plugins/commit/bf48970fe7))
- **common-core:** correctly track project dependencies ([fc95585f8a](https://github.com/Ensono/stacks-nx-plugins/commit/fc95585f8a))
- **create:** run target project for next init ([d237848b2f](https://github.com/Ensono/stacks-nx-plugins/commit/d237848b2f))
- **common-e2e:** patch e2e publishing to not conflict with npm packages ([0fa47a512a](https://github.com/Ensono/stacks-nx-plugins/commit/0fa47a512a))
- **create:** add github post target ([dd2fa4b7ab](https://github.com/Ensono/stacks-nx-plugins/commit/dd2fa4b7ab))
- **create:** version bump ([59deca77f2](https://github.com/Ensono/stacks-nx-plugins/commit/59deca77f2))
- **create:** skip generating changelog ([17b9cb97d6](https://github.com/Ensono/stacks-nx-plugins/commit/17b9cb97d6))
- **create:** add missing exclusion in tsconfig ([3497490fe8](https://github.com/Ensono/stacks-nx-plugins/commit/3497490fe8))
- **create:** correctly mock files in dependencies ([9de7408a11](https://github.com/Ensono/stacks-nx-plugins/commit/9de7408a11))

### ⚠️  Breaking Changes

- **create:** release v2

### ❤️ Thank You

- Cerden Mincher
- Chris Winch
- Daniel Phillips
- Elliot Evans
- Gareth Cozens
- Isaac Shek
- leesaxby @leesaxby
- MarkComerford
- Metecan Aydin
- Michal Palys-Dudek
- Nandor Szentpeteri
- Richard Slater