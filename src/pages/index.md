---
layout: ../layouts/Markdown.astro
title: I18n tools playground
---

## I18n PR description generator

[/description](/description)

Usage:

Input your PR link, the git ref of the original text cooresponding to the PR, and a GitHub API token without any permissions.
Generate a description for your PR similar to the one below:

> Updated translation based on source texts at [b653f6f](https://github.com/withastro/starlight/tree/b653f6f4ba8939e91f5e1ecec14a5a14d7ec1c91).
>
> | File | Source | Source Diff | Other Links |
> | --- | --- | --- | --- |
> | `guides/customization.mdx` | [source@`b653f6f`](https://github.com/withastro/starlight/blob/b653f6f4ba8939e91f5e1ecec14a5a14d7ec1c91/docs/src/content/docs/guides/customization.mdx) | [`dcce068..b653f6f`](/diff#withastro/starlight/dcce068e1192d99d6c94b70c52e16ef6bcbe87a8..b653f6f4ba8939e91f5e1ecec14a5a14d7ec1c91/docs/src/content/docs/guides/customization.mdx) | [blame@`b653f6f`](https://github.com/withastro/starlight/blame/b653f6f4ba8939e91f5e1ecec14a5a14d7ec1c91/docs/src/content/docs/guides/customization.mdx) <br> [blame@`main`](https://github.com/withastro/starlight/blame/main/docs/src/content/docs/guides/customization.mdx) <br> [history@`main`](https://github.com/withastro/starlight/commits/main/docs/src/content/docs/guides/customization.mdx) |
> | `reference/configuration.md` | [source@`b653f6f`](https://github.com/withastro/starlight/blob/b653f6f4ba8939e91f5e1ecec14a5a14d7ec1c91/docs/src/content/docs/reference/configuration.md) | [`dcce068..b653f6f`](/diff#withastro/starlight/dcce068e1192d99d6c94b70c52e16ef6bcbe87a8..b653f6f4ba8939e91f5e1ecec14a5a14d7ec1c91/docs/src/content/docs/reference/configuration.md) | [blame@`b653f6f`](https://github.com/withastro/starlight/blame/b653f6f4ba8939e91f5e1ecec14a5a14d7ec1c91/docs/src/content/docs/reference/configuration.md) <br> [blame@`main`](https://github.com/withastro/starlight/blame/main/docs/src/content/docs/reference/configuration.md) <br> [history@`main`](https://github.com/withastro/starlight/commits/main/docs/src/content/docs/reference/configuration.md) |

**Pro tip**: you can use `main@{4 days ago}` (main at 4 days ago) or `main~10` (main but 4 commits ago) as the "before ref".

## Single file diff view

It's like GitHub's native diff view, but only shows the changes in a single file.

Usage:

`https://example.com/diff#:owner/:repo/:from..:to/:path`

Example:

[/diff#withastro/starlight/70a32a1736c776febb34cf0ca3014f375ff9fec8..140e729a8bf12f805ae0b7e2b5ad959cf68d8e22/docs/src/content/docs/reference/configuration.md](/diff#withastro/starlight/70a32a1736c776febb34cf0ca3014f375ff9fec8..140e729a8bf12f805ae0b7e2b5ad959cf68d8e22/docs/src/content/docs/reference/configuration.md)

## Source code

Source code for this website is available at <https://github.com/genteure/i18n-tools>
