# Ikki ERP Documentation

Welcome to the Ikki ERP documentation. This repository is structured to be readable, simple, and effective for both the development team and AI context (AI agents/skills).

## 📁 Directory Structure

We strictly separate **Business/Product Definitions** from **Technical Implementations** to keep things clean.

### 1. `/product`
Contains high-level product strategy and logic.
- `VISION.md`: Overall product vision and north star.
- `PRD.md`: Main Product Requirements Document.
- `WORKFLOWS.md`: High-level business process flows.

### 2. `/features`
Contains detailed, module-by-module business requirements.
- These documents are written from a **Product Manager's perspective**.
- They outline the **Overview, Core Objectives, Use Cases, and Recommended Enhancements**.
- **No technical implementation** (API, SQL, Data Models) is kept here. This ensures the documents serve as clear AI context and business guidelines without technical clutter.

### 3. `/technical`
Contains all the developer-focused documentation.
- `ARCHITECTURE.md`: System design and backend architecture.
- `DATA_MODEL.md`: Database schemas and relationships.
- `Tech-Specs.md`: Specific technical specifications and API contracts.
- `CODE_PATTERNS.md`: Guidelines for writing code.
- `MODULE_CHECKLIST.md`: Checklist for developing new modules.

### 4. `/templates`
Contains templates to standardize our documentation.
- `FEATURE_TEMPLATE.md`: Use this template when writing a new document for `/features`.
- `FEATURE_DOCUMENTATION_STANDARD.md`: Rules and standards for documenting features.

### 5. `/backlog`
- `FEATURE_ENHANCEMENT_PLAN.md`: Ideas and planned improvements for phase 2 and beyond.

## 🎯 Documentation Principles

1. **Keep it simple**: Use clear, good English. Avoid unnecessary jargon.
2. **Business First in Features**: Feature documentation focuses entirely on *what* the business needs and *why*, not *how* to code it.
3. **AI Friendly**: Write in structured formats (Markdown headers, bullet points, clear steps) so AI agents can easily ingest these documents as "Skills" and context.
4. **Remove the Useless**: If a document or section doesn't add value or clear context, it is removed.
