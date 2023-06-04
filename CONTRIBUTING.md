# Contributing Guide

Hi! We are really excited that you are interested in contributing to `@vite-pwa/assets-generator`. Before submitting your contribution, please make sure to take a moment and read through the following guide.

Refer also to https://github.com/antfu/contribute.

## Set up your local development environment

The `@vite-pwa/assets-generator` repo is a monorepo using pnpm workspaces. The package manager used to install and link dependencies must be [pnpm](https://pnpm.io/).

To develop and test the `@vite-pwa/assets-generator` package:

1. Fork the `@vite-pwa/assets-generator` repository to your own GitHub account and then clone it to your local device.

2. `@vite-pwa/assets-generator` uses pnpm v8. If you are working on multiple projects with different versions of pnpm, it's recommend to enable [Corepack](https://github.com/nodejs/corepack) by running `corepack enable`.

3. Check out a branch where you can work and commit your changes:
```shell
git checkout -b my-new-branch
```

5. Run `pnpm install` in `@vite-pwa/assets-generator`'s root folder

6. Run `nr build` in `@vite-pwa/assets-generator`'s root folder.

7. Run `nr test` in `@vite-pwa/assets-generator`'s root folder.

## Running tests

Build the project from root folder and the test (`nr build && nr test`).
