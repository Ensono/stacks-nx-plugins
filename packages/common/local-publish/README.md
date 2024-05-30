# local-publish

Library for publishing packages to local npm registry (verdaccio).

## Usage

Start the local registry in your terminal:

```bash
npx nx local-registry
```

You should be able to visit the local registry at http://localhost:4873.

In a separate terminal run the local-publish executor to publish all packages:

```bash
  npx nx local-publish
```

When running the executor it does the following:
- Builds all packages to the /dist folder
- Bumps the versions of built packages in the dist folder
- Saves a cache of the package versions in the dist folder ( .local-publish-cache.json )
- Publishes the packages to the local registry at http://localhost:4873


## TODO
[] Figure out a way of clearing the version cache to avoid insanely high patch numbers. Could possibly attempt to clear when local-registry is stopped.
