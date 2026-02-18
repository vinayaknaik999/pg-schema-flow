# PGSchemaFlow

![PGSchemaGlow](https://img.shields.io/badge/Status-Beta-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**Opensource PG Database Toolkit**

A powerful, local-first visual schema designer for PostgreSQL. Built with **Next.js**, **React Flow**, and **PGlite**, it allows you to design, visualize, and test your database schemas entirely in the browser without any backend dependencies.

## ✨ Features

### 🎨 Visual Editor
-   **Interactive Canvas**: Infinite canvas to arrange tables with drag-and-drop.
-   **Crow's Foot Notation**: Visualize one-to-many relationships clearly.
-   **Auto-Layout**: Instantly organize messy diagrams with a single click.
-   **Minimap & Zoom**: Navigate large schemas with ease.

### 🛠️ Schema Management
-   **Visual Table Management**: Add, rename, duplicate, and delete tables.
-   **Column Editor**:
    -   Support for all standard PostgreSQL types (UUID, JSONB, Arrays, etc.).
    -   Drag-and-drop column reordering.
    -   Quick inline column addition.
    -   Toggle Primary Key, Unique, and Nullable constraints.
-   **Enums**: Create and manage reusable custom Enum types.

### ⚡ Powered by PGlite & SQL
-   **Real-time SQL Generation**: Instantly see the `CREATE TABLE` SQL for your schema.
-   **Local Execution**: Verify your schema runs correctly against an in-memory Postgres database (PGlite).
-   **Import/Export**:
    -   **Export SQL**: Download production-ready `.sql` migration files.
    -   **Import SQL**: Reverse-engineer existing schemas by pasting `CREATE TABLE` statements.
    -   **Save/Load**: Persist projects to local storage or export as JSON.

### 📂 Project Management
-   **Multiple Projects**: Manage multiple independent schema designs.
-   **Search & Sort**: Quickly find projects by name or modification date.
-   **History**: Full Undo/Redo support for peace of mind.

### 🌗 UI/UX
-   **Dark Mode**: First-class dark theme support.
-   **Responsive**: Optimized for various screen sizes.
-   **Collapsible Panels**: Maximize your workspace.

---

## 🚀 Getting Started

### Prerequisites
-   Node.js 18+
-   npm or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/vinayaknaik999/pg-schema-flow.git
    cd pg-schema-flow
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Open in Browser**
    Navigate to [http://localhost:3000](http://localhost:3000) to start designing!

---

## 📖 Usage Guide

### Creating a New Table
Click the **"Add Table"** button in the header or right-click anywhere on the canvas and select **"Add Table"**.

### Adding Columns
1.  Select a table node.
2.  Use the **Properties Panel** on the right to add columns.
3.  Alternatively, click the **`+`** button at the bottom of the table node for quick inline addition.

### Creating Relationships
Drag from a handle (dot) on a source column (Foreign Key) to a target column (Primary Key) to create a relationship. The UI will validate compatibility (e.g., ensuring types match).

### Exporting SQL
1.  Open the **"SQL Preview"** panel (top-right).
2.  Click **"Copy SQL"** to copy to clipboard or use the **"Export / Import"** menu in the header to download a `.sql` file.

---

## 🛠️ Tech Stack

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Visualization**: [React Flow](https://reactflow.dev/)
-   **Database Engine**: [PGlite](https://pglite.dev/) (Postgres in WASM)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
