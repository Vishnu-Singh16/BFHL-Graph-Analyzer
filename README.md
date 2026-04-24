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
│   ├── style.css              # Styling
│   └── script.js              # Client-side logic
└── README.md
```

---

## 🚀 Setup & Run

### Prerequisites

* Node.js (v18 or higher)

### Install & Start

```bash
cd backend
npm install
npm start
```

Open in browser:

```
http://localhost:3000
```

---

## ⚙️ Configuration

Update your details in:

```js
backend/config.js
```

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

### POST `/bfhl`

### Request

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

---

### Response (Tree Example)

```json
{
  "user_id": "your_name_ddmmyyyy",
  "email_id": "your_email@example.com",
  "college_roll_number": "YOUR_ROLL_NUMBER",
  "hierarchies": [
    {
      "root": "A",
      "tree": {
        "A": {
          "B": { "D": {} },
          "C": {}
        }
      },
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

### Response (Cycle Example)

```json
{
  "hierarchies": [
    {
      "root": "A",
      "tree": {},
      "has_cycle": true
    }
  ]
}
```

---

## 🧪 Sample Test Cases

### 1. Basic Tree

```json
{ "data": ["A->B", "A->C", "B->D"] }
```

### 2. Cycle

```json
{ "data": ["A->B", "B->C", "C->A"] }
```

### 3. Duplicates + Invalid

```json
{ "data": ["A->B", "A->B", "hello", "1->2", "B->C", "A->A"] }
```

### 4. Multiple Trees

```json
{ "data": ["A->B", "B->C", "D->E", "E->F"] }
```

### 5. Tree + Cycle

```json
{ "data": ["A->B", "B->C", "D->E", "E->F", "F->D"] }
```

---

## ⚙️ Processing Rules (Summary)

* **Validation**: Must follow `X->Y` (single uppercase letters), no self-loops
* **Duplicates**: Only first occurrence used, rest tracked
* **Graph Rule**: Each node can have only one parent (first wins)
* **Root**: Node that never appears as child
* **Cycle**: Return `{ tree: {}, has_cycle: true }`
* **Depth**: Count of nodes in longest path
* **Summary**:

  * Count only non-cyclic trees
  * Largest tree based on depth
  * Tie → lexicographically smaller root

---

## ☁️ Deployment

### Render (Backend + Frontend)

1. Push project to GitHub
2. Go to https://render.com
3. Create **Web Service**
4. Settings:

   * Root Directory: `backend`
   * Build Command: `npm install`
   * Start Command: `node server.js`

---

## 📌 Notes

* API response time < 3 seconds for up to 50 nodes
* CORS enabled
* No hardcoding — dynamic processing

---

## ✅ Status

✔ Fully implemented
✔ All edge cases handled
✔ Ready for submission
