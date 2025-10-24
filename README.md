# REI (Recommendation Everything Independent)

REI is a lightweight, frontend‑only recommendation toolkit. It runs completely in the browser, embedding data with small pretrained models, simple tag rules, or other lightweight methods, and re‑ranking items locally.

## Core Idea

### Overview

REI is built on a simple principle: **everything happens on the frontend**.

This means no backend logic, no API calls, and no tracking—just client‑side computation. This makes REI private by default, lightweight, and easy to integrate.

### Key Features

* **Lightweight:** Designed for edge devices and resource-limited environments.
* **Privacy by design:** User data never leaves the device.
* **Low disruption:** REI reorders existing items instead of changing what users see, keeping experiences familiar, while working directly with the limited set of content already available in the DOM.

### Ideal Use Cases

* **News readers / RSS feeds** – recent items matter most
* **Trending or hot lists** – popularity-driven content
* **E-commerce carousels** – limited visible products

### When to Use

REI is best suited for environments where:

* Backend or data resources are limited
* Privacy or compliance is a concern
* Existing sorting (recency, popularity) already works, but subtle personalization is desired
* Minimal engineering effort and stable UX are priorities

## Minimum Viable Product Demo

There's an MVP of REI that helps you quickly understand how REI works and what it does.

This MVP demonstrates:

* A list of items and a click history panel.
* Clicking an item updates the user profile and instantly reranks items.
* Multi-language embedding via `Xenova/paraphrase-multilingual-MiniLM-L12-v2` (running fully in-browser via `transformers.js`).
* Ranking uses **cosine similarity** on the user's average embedding.

![mvp\_demo.png](https://raw.githubusercontent.com/avengerandy/REI/master/mvp_demo.png)

You can find the working MVP in the root folder: [`mvp.html`](https://github.com/avengerandy/REI/blob/master/mvp.html).

> The demo dataset is sourced from the book rankings on 博客來 ([https://www.books.com.tw](https://www.books.com.tw)) and is used solely for research and testing purposes. No commercial use is intended. If any infringement is found, please contact us for immediate removal.

## Architecture

The main `src` code provides a **production-like modular framework**:

* **Entities:** `Item` and `User` store data, embeddings, and click history.
* **Processors:** `EmbeddingProcessor` handles in-browser embeddings.
* **Rerankers:** `BetaLikelihoodReranker` implements LILY; other ranking strategies can be added.
* **Registry:** `ItemRegistry` manages items and associated DOM elements.
* **UI Controller:** Interfaces with the webpage DOM to extract items, handle clicks, and reorder lists.
* **Storage:** Local and session storage for user profiles.

**Goal:** Show **how REI can scale and remain modular**, while still performing the same operations as the MVP.

**TODO:** Add diagrams showing the pipeline: `ItemRegistry → EmbeddingProcessor → Reranker → UIController`.

## Processors & Rerankers

REI supports multiple ranking strategies and processors.

### Processors

* Xenova/paraphrase-multilingual-MiniLM-L12-v2

**TODO:** Document other processors.

### Rerankers

* **LILY (Beta-likelihood):** Updates scores incrementally based on user clicks.
* **PLUTO (TODO):** A planned alternative for lightweight, front-end-friendly ranking.

**TODO:** Document LILY & PLUTO, including strengths, weaknesses, and cost.

## Browser Extension Examples

We provide examples showing REI applied to **existing websites**:

* Automatically extract visible items from pages (books, products, etc.).
* Compute embeddings and rerank items locally.
* Demonstrates the concept of **personalized browsing without data collection**.

**TODO:** List example websites, including screenshots and which Processors & Rerankers they use.

## Testing & Coding style & Build

REI tests are divided into three levels based on their dependency scope:

```bash
# run all of them
npm run test:all
```

### 1. Unit

* Must not depend on other REI modules.
* No access to any **external resources** (network, file system, etc.).
* Typically used for lowest-level objects or helper functions.

```bash
npm run test:unit
```

### 2. Functional

* Can depend on lower-level REI modules (assumed to be correct).
* Tests logical behavior across multiple components.
* Still **no external resources** — mock them if necessary (ex: jsdom).

```bash
npm run test:functional
```

### 3. Integration

* May access **external resources** (e.g., network, local files, APIs).
* Tests full workflows or real pipelines.
* Be cautious of side effects, as these tests execute real operations.

```bash
npm run test:integration
```

### Coding Style

REI follows **Google TypeScript Style (GTS)** for linting and formatting.

* `lint` checks for style violations.
* `fix` automatically corrects common issues.

```bash
npm run lint
npm run fix
```

### Build

REI uses **esbuild** for bundling and type-checking via **TypeScript**.

* `typecheck` ensures type safety without emitting files.
* `build` compiles all targets (index, books, content) into `public/dist/`.

```bash
npm run typecheck
npm run build
```

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/avengerandy/REI/blob/master/LICENSE) file for details.
