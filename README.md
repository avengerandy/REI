# REI (Recommendation Everything Independent)

REI is a lightweight, frontend‑only recommendation toolkit. It runs completely in the browser, embedding data with small pretrained models, simple tag rules, or other lightweight methods, and re‑ranking items locally.

## Core Idea

REI is built on a simple principle: **everything happens on the frontend**.

This means no backend logic, no API calls, and no tracking—just client‑side computation. This makes REI private by default, lightweight, and easy to integrate.

Frontend systems naturally work with a **limited set of content already available in the DOM**, making REI ideal for scenarios such as:

* **News readers** or **RSS feeds** – time-driven; only recent content matters
* **Trending or hot lists** – popularity-driven; limited in size
* **E-commerce carousels** – re-ranking a few visible products

REI allows personalization **without storing user data**, letting individuals customize their own browsing experience.

## Minimum Viable Product Demo

There's a MVP of REI that helps you quickly understand how REI works and what it does.

This MVP demonstrates:

* A list of items and a click history panel.
* Clicking an item updates the user profile and instantly reranks items.
* Multi-language embedding via `Xenova/paraphrase-multilingual-MiniLM-L12-v2` (running fully in-browser via `transformers.js`).
* Ranking currently uses **Beta-likelihood**, but **TODO:** switch to **cosine similarity** for simplicity.

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
**TODO:** testing & coding style

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

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/avengerandy/REI/blob/master/LICENSE) file for details.
