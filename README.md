# BFHL — Graph Hierarchy Analyzer

REST API + Frontend for processing directed edge relationships, detecting cycles, building tree hierarchies, and returning structured insights.

---

## 📁 Project Structure

```
Bajaj Test/
├── backend/
│   ├── config.js              # User identity & port config
│   ├── package.json
│   ├── server.js              # Express entry point
│   ├── routes/
│   │   └── bfhl.js            # POST /bfhl route
│   ├── controllers/
│   │   └── bfhlController.js  # Request handling
│   ├── services/
│   │   └── graphService.js    # Core graph processing pipeline
│   └── utils/
│       ├── validator.js       # Entry validation
│       └── helpers.js         # Dedup & component detection
├── frontend/
│   ├── index.html             # UI markup
│   ├── style.css              # Dark theme design system
│   └── script.js              # Client-side logic
└── README.md
```

---

## 🚀 Setup & Run

### Prerequisites
- [Node.js](https://nodejs.org/) v18+

### Install & Start

```bash
cd backend
npm install
npm start
```

Open **http://localhost:3000** in your browser.

### Configuration

Edit `backend/config.js` to set your identity:

```js
module.exports = {
  USER_ID: 'your_name_ddmmyyyy',
  EMAIL_ID: 'your_email@example.com',
  COLLEGE_ROLL_NUMBER: 'YOUR_ROLL_NUMBER',
  PORT: process.env.PORT || 3000
};
```

---

## 📡 API Reference

### `POST /bfhl`

**Request:**
```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

**Response:**
```json
{
  "user_id": "your_name_ddmmyyyy",
  "email_id": "your_email@example.com",
  "college_roll_number": "YOUR_ROLL_NUMBER",
  "hierarchies": [
    {
      "tree": { "A": { "B": { "D": {} }, "C": {} } },
      "has_cycle": false,
      "depth": 3
    }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

---

## 🧪 Sample Test Cases

### 1. Basic Tree
```json
{ "data": ["A->B", "A->C", "B->D"] }
```
→ 1 tree, depth 3, root "A"

### 2. Cycle Detection
```json
{ "data": ["A->B", "B->C", "C->A"] }
```
→ 1 cycle, `{ "tree": {}, "has_cycle": true }`

### 3. Duplicates + Invalid
```json
{ "data": ["A->B", "A->B", "hello", "1->2", "B->C", "A->A"] }
```
→ duplicate_edges: ["A->B"], invalid_entries: ["hello", "1->2", "A->A"]

### 4. Multiple Trees
```json
{ "data": ["A->B", "B->C", "D->E", "E->F"] }
```
→ 2 trees, largest root by depth

### 5. Mixed Trees + Cycle
```json
{ "data": ["A->B", "B->C", "D->E", "E->F", "F->D"] }
```
→ 1 tree (A->B->C), 1 cycle (D,E,F)

### 6. Self-loop + Empty
```json
{ "data": ["A->A", "", "A->B"] }
```
→ invalid: ["A->A", ""], 1 tree (A->B)

### 7. Multiple Parents (single-parent rule)
```json
{ "data": ["A->C", "B->C", "C->D"] }
```
→ C's parent = A (first). B becomes isolated node. 2 trees.

---

## ☁️ Deployment

### Render (Full Stack)

1. Push to GitHub
2. Create a **Web Service** on [Render](https://render.com)
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** `PORT` = auto-set by Render

### Vercel (Frontend Only)

1. Create a new project on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set `API_BASE` in `frontend/script.js` to your Render backend URL

---

## 📋 Processing Rules Summary

| Step | Rule |
|------|------|
| Validation | `X->Y`, single uppercase letters, no self-loops |
| Duplicates | Keep first, track extras |
| Graph | Single parent per node (first wins) |
| Roots | Node never appearing as child |
| Cycles | Pure cycle → `{ tree: {}, has_cycle: true }` |
| Depth | Nodes in longest root-to-leaf path |
| Summary | Count non-cyclic trees; tie-break by lex order |
