# Magic Graph / Reports

![Neo4J](https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge&logo=neo4j&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)
![Vscode](https://img.shields.io/badge/Vscode-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)

---

## About

Small demo project. It collects collectible-card data (example: Scryfall for Magic: The Gathering), stores it in **Neo4J**, and produces a PDF report rendered from HTML using Node + TypeScript and **Puppeteer**.

This repo demonstrates:

- Node + TypeScript backend code
- Non Relational modeling in Neo4J
- Reproducible dev environment with Docker
- Seed script to import card data
- Automated HTML → PDF reporting

---

## Stack

- **Node.js** (runtime)
- **TypeScript** (language)
- **Neo4J** (database)
- **Puppeteer** (HTML → PDF rendering)
- **Docker / Docker Compose** (dev environment)
- **VSCode** (recommended editor)
- **GitHub** (repo / version control)

---

## Features

- Docker Compose configuration to run PostgreSQL locally
- Seed script that ingests card data (via Scryfall API)
- Report generator: query DB, create HTML, convert to PDF (Puppeteer)
- Example SQL schema & helpful example queries
- Scripts in `package.json` for common tasks
