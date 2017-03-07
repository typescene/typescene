# Typescene API Documentation Generator

This module is used as a development dependency, to produce API documentation in JSON format and generate a reader application.

> **Note:** To learn more about Typescene, head over to the main [Typescene repository](https://www.github.com/typescene/typescene).

You do NOT need to use this module in your own projects.

---

How it works:

* _Declaration files_ &mdash; all `*.d.ts` files are read using the TypeScript compiler, and their declarations are merged together, along with their JSDoc documentation.
* _Markdown files_ &mdash; all `*.ref.md` files are parsed; sections with annotated IDs (or matching titles) are merged with declared classes, interfaces, members, etc. from the declaration files. Other sections are included as just text documents.
* _JSON output_ &mdash; the main API function produces a single JSON output string with all declarations and text. This file also includes a Table of Contents structure which should link all items together.
* _Reader application_ &mdash; a precompiled reader application (source included in the `src/` folder in this repository) that reads a JSON file, is loaded by an `index.html` file for direct hosting on _github.io_.

The following comments can be inserted right underneath sections in `.ref.md` files to change the way they are displayed:

```html
<!-- docTitle: Overall title of the entire document collection -->
<!-- id: ID_of_this_section --> or
<!-- id: ID_of_this_section/sub_section --> or
<!-- parent: ID_of_TOC_parent -->
<!-- topic: Name for TOC listing -->
<!-- slug: some-url-slug -->
<!-- sort: ID_used_for_sorting -->
<!-- seeAlso: See_Also_Doc_ID_1, See_Also_Doc_ID_2, Etc -->

For note blocks:
<!-- type: note -->
<!-- collapse: heading -->

For code examples
<!-- type: example -->
<!-- displayResult: View -->
<!-- collapse: heading -->
```