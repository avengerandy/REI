# REI (Recommendation Everything Independent)

REI (Recommendation Everything Independent) is a modular, frontend-first recommendation system architecture. It is designed to be lightweight, plugin-compatible, and privacy-preserving — capable of running entirely in the browser without relying on servers or personal data collection.

This repository contains an MVP implementation that demonstrates the core idea with minimal dependencies.

## Project Goals

REI aims to:

- Enable personalized recommendation without centralized servers
- Support full modularization: data ingestion, embedding, profiling, and ranking
- Offer both lightweight (browser-based) and advanced (optional backend) operation modes
- Protect user privacy by default — all processing happens client-side

## MVP: Quick Overview

You can find the working MVP in the root file: [`mvp.html`](https://github.com/avengerandy/REI/blob/master/mvp.html).

This MVP shows:

- A two-panel UI for user interaction
  - Left panel: candidate items
  - Right panel: user click history
  - Clicking any item updates the user profile and re-ranks the list in real time

- Multi-language embedding via `Xenova/paraphrase-multilingual-MiniLM-L12-v2` (running fully in-browser via `transformers.js`)
- Sigmoid normalization on the embedding vectors to bound values into (0,1)
- A custom user modeling and ranking technique:
  - **Beta-Likelihood Scoring over Embedding Dimensions**:
    - For each embedding dimension, the model estimates a Beta distribution from user interactions
    - New items are scored by how likely they match the learned distribution

No backend. No personal data. Everything runs in the browser.

![mvp_demo.png](https://raw.githubusercontent.com/avengerandy/REI/master/mvp_demo.png)

> The demo dataset is sourced from the book rankings on 博客來 ([https://www.books.com.tw](https://www.books.com.tw)) and is used solely for research and testing purposes. No commercial use is intended. If any infringement is found, please contact us for immediate removal.

## Future Work

Planned enhancements include:

- Pluggable data and model modules (e.g., image embeddings)
- Incremental user modeling updates
- Hybrid ranking mechanisms (e.g., Thompson Sampling with exploration)
- Visualization dashboards for interpretability
- Offline cache and persistence options

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/avengerandy/REI/blob/master/LICENSE) file for details.
