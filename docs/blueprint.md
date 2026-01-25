# **App Name**: StockImfo

## Core Features:

- Daily Inventory Tracking: Track inventory levels daily with fields for code, description, physical count, and system count.
- Unit and Case Management: Allow products to be managed both by individual units and by cases.
- Discrepancy Calculation: Automatically calculate the difference between physical and system inventory counts.
- Branch Management: Support multiple branches or locations, with the ability to add and manage branches.
- Data Validation: LLM Tool will inspect proposed data entry and warn user if it seems internally inconsistent (e.g. very high stock level, or physically impossible data such as a negative stock level, a text entered instead of a number etc)
- Inventory Logging: Automatically log and timestamp all inventory changes and discrepancies for auditing purposes.

## Style Guidelines:

- Primary color: Calm blue (#64B5F6) to evoke trust and reliability.
- Background color: Light blue (#E3F2FD) provides a clean and unobtrusive backdrop.
- Accent color: Soft orange (#FFAB91) for key actions and alerts, ensuring important elements stand out.
- Font: 'Inter', a grotesque-style sans-serif for clear and modern readability across the entire application.
- Simple, clear icons for navigation and product categories.
- Clean, tabular layouts for inventory data with clear column headers.
- Subtle transitions for loading data and updating inventory counts.