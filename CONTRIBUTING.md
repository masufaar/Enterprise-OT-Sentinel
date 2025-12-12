
# Contributing to Enterprise OT Sentinel

Thank you for your interest in contributing to **Enterprise OT Sentinel**. We welcome contributions from the community to help make industrial autonomy more secure and accessible.

## 🛠️ Development Workflow

1.  **Fork the repository** to your GitHub account.
2.  **Clone the fork** to your local machine.
3.  **Create a branch** for your feature or bug fix:
    ```bash
    git checkout -b feature/my-new-feature
    ```
4.  **Install dependencies**:
    ```bash
    npm install
    ```
5.  **Make your changes**. Ensure you follow the code style (React Functional Components, Hooks, TypeScript).

## 🧪 Testing Requirements

We follow a strict "Safety First" testing policy given the industrial nature of this app.

*   **Unit Tests**: Must be added for all new UI components. Run via `npm test`.
*   **E2E Tests**: Critical user journeys must be verified. Run via `npm run test:e2e`.
*   **Coverage**: Please ensure meaningful assertions, not just "it renders".

## 🤖 AI Agent Guidelines

If modifying `services/geminiService.ts` or `services/agentOrchestrator.ts`:
*   Ensure **Human-in-the-Loop (HIL)** gates are preserved for critical actions (e.g., deploying code, changing PLC state).
*   Do not hardcode API keys. Use `process.env.API_KEY`.

## 📜 Pull Request Process

1.  Push your branch to GitHub.
2.  Open a **Pull Request** against the `main` branch.
3.  Describe your changes, referencing any related issues.
4.  Wait for CI checks to pass (Build, Lint, Test).

## 📄 License

By contributing, you agree that your contributions will be licensed under its [MIT License](LICENSE).
