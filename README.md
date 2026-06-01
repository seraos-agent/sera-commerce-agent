# SERA — Autonomous AI Commerce Platform

<p align="center">
  <img src="public/sera-logo.png" alt="SERA Logo" width="120" />
</p>

<p align="center">
  <b>Store Creation & Autonomous Commerce Agent Platform</b><br/>
  Powered by Google Gemini AI · MongoDB Atlas · Google ADK
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4?logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_ADK-Agent_Dev_Kit-34A853?logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" />
</p>

---

## 🚀 What is SERA?

**SERA** is an autonomous AI commerce platform that lets anyone create, manage, and analyze a fully functional digital storefront through natural language conversation. The AI agent handles everything — from store design to product strategy — while the seller simply talks.

> *"You describe. SERA builds. AI sells."*

---

## 🎯 Key Capabilities

| Feature | Description |
|---|---|
| 🏪 **AI Store Builder** | Generate a complete storefront (products, theme, branding, philosophy) from a single prompt |
| 📊 **MongoDB Analytics via MCP** | AI agent reads live store data from MongoDB Atlas using Model Context Protocol to deliver real revenue insights |
| 🎯 **Marketing Advisor** | AI suggests campaigns, video banners, and product positioning strategies |
| 🛍️ **Buyer Discovery Feed** | Buyers explore AI-created stores and chat with an AI assistant to find the perfect product |
| 🤖 **Autonomous Agent Loop** | The AI agent plans, executes, validates, and reports — no human micromanagement needed |

---

## 🏗️ System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ React Frontend  │────▶│  Node.js Backend  │────▶│  MongoDB Atlas   │
│ (Vite)          │     │  (Express)        │◀────│  (via MCP)       │
│ Port: 5173      │     │  Port: 3001       │     │                  │
└────────┬────────┘     └──────────────────┘     └──────────────────┘
         │
         │              ┌──────────────────┐
         └─────────────▶│  Python Agent    │
                        │  (Google ADK)    │
                        │  Port: 8000      │
                        └──────────────────┘
```

**How the MCP connection works:**
1. The seller clicks "Analyze Store"
2. The React frontend sends a request to the Node.js backend
3. Node.js spawns a `mongodb-mcp-server` process via `StdioClientTransport`
4. The AI agent calls MCP tools (`find`, `aggregate`, `insertOne`) to read/write MongoDB Atlas directly
5. Gemini AI synthesizes the raw data into a structured analytics report

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS with custom design system |
| Backend | Node.js + Express |
| AI Agent | Python + Google ADK (Agent Development Kit) |
| AI Model | Google Gemini 2.0 Flash |
| Database | MongoDB Atlas |
| DB Integration | MongoDB MCP Server (Model Context Protocol) |
| Deployment | Docker + Google Cloud Run (optional) |

---

## 📦 Getting Started

### Prerequisites
- Node.js >= 18
- Python >= 3.10
- MongoDB Atlas account (free tier works)
- Google Cloud project with Gemini API or Vertex AI enabled

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/sera-hackathon.git
cd sera-hackathon
```

### 2. Set Up the Frontend
```bash
npm install
cp .env.example .env
# Fill in VITE_BACKEND_URL and VITE_ADK_URL
```

### 3. Set Up the Node.js Backend
```bash
cd server
npm install
cp .env.example .env
# Fill in MONGODB_URI (from MongoDB Atlas) and PORT
```

### 4. Set Up the Python Agent
```bash
cd sera-agent-python
pip install -r requirements.txt
cp .env.example .env
# Fill in GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION
```

### 5. Run All Services
```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Node.js Backend
cd server && node index.js

# Terminal 3 — Python Agent
cd sera-agent-python && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Open your browser at `http://localhost:5173`

---

## ✨ Feature Highlights

### 🏪 Seller Mode — AI Store Builder
- **Conversational store creation**: describe your brand in plain text, the AI generates the full schema
- **Live preview**: see your store take shape in real time as the agent builds it
- **Product management**: AI suggests product names, descriptions, pricing, and promo tags
- **Video marketing**: upload or generate storefront banner videos (16:9) and promo reels (9:16)
- **Store Analytics**: the AI agent connects to MongoDB Atlas via MCP and delivers a comprehensive report — revenue trends, top products, conversion rates, and actionable recommendations

### 🛍️ Buyer Mode — AI Discovery
- Browse a curated feed of AI-generated storefronts
- Use the AI buyer assistant to find products by natural language query
- Filter by category, follow stores, and add items to cart

---

## 🔑 Environment Variables

Each service requires its own `.env` file. Refer to the `.env.example` file in each directory for the required variables.

| File | Key Variables |
|---|---|
| `.env` | `VITE_BACKEND_URL`, `VITE_ADK_URL` |
| `server/.env` | `MONGODB_URI`, `PORT` |
| `sera-agent-python/.env` | `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `GOOGLE_GENAI_USE_VERTEXAI` |

---

## 🏆 Built For

**Google Cloud Hackathon 2026** — Category: AI-Powered Autonomous Commerce

---

## 📄 License

MIT License
