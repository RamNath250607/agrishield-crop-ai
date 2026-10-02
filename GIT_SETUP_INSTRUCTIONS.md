# How to Push AgriShield Crop AI to GitHub

## Prerequisites
1. [Git](https://git-scm.com/downloads) installed
2. [GitHub](https://github.com) account
3. Optionally: [GitHub CLI](https://cli.github.com/)

## Method 1: Using GitHub CLI (Recommended)

### Step 1: Install GitHub CLI
```bash
# Using winget (Windows Package Manager)
winget install GitHub.cli

# Or download from: https://cli.github.com/
```

### Step 2: Authenticate with GitHub
```bash
gh auth login
# Follow the prompts to authenticate via browser or personal access token
```

### Step 3: Navigate to Project Directory
```bash
cd "C:\Users\DEEPAK KUMAR K\.gemini\antigravity-ide\scratch\agrishield-crop-ai"
```

### Step 4: Initialize Repository and Push to GitHub
```bash
# Initialize git repo
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit: AgriShield Crop AI plant disease detection system"

# Create repository on GitHub and push
gh repo create agrishield-crop-ai --public --source=. --push
```

## Method 2: Manual Git + GitHub Website

### Step 1: Install Git
```bash
winget install Git.Git
# Restart terminal after installation
```

### Step 2: Create Repository on GitHub
1. Go to https://github.com/new
2. Repository name: `agri-shield-crop-ai`
3. Description: "Plant disease detection and treatment recommendation system using computer vision and ML"
4. Choose: Public (or Private if preferred)
5. Initialize with README: Optional
6. Click "Create repository"

### Step 3: Set Up Local Repository
```bash
# Navigate to project directory
cd "C:\Users\DEEPAK KUMAR K\.gemini\antigravity-ide\scratch\agrishield-crop-ai"

# Initialize git
git init

# Configure user (replace with your info)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add files
git add .

# Commit
git commit -m "Initial commit: AgriShield Crop AI project"

# Add remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/agri-shield-crop-ai.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

## Method 3: Using GitHub Desktop (GUI)
1. Download and install [GitHub Desktop](https://desktop.github.com/)
2. Sign in to your GitHub account
3. File → Add Local Repository → Point to your project folder
4. Click "Commit to main" with a message
5. Click "Publish Repository"

## What Will Be Included

The following files and directories will be uploaded:

```
agri-shield-crop-ai/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   └── agri_agent.py
│   │   ├── ml/
│   │   │   ├── classifier.py
│   │   │   ├── severity_estimator.py
│   │   │   ├── yolo_detector.py
│   │   └── pesticide_recommender.py
│   │   ├── yolo_detector.py
│   │   │   └── pesticide_recommender.py
│   │   ├── main.py
│   │   ├── schemas.py
│   │   └── database.py
│   ├── static/
│   ├── test_api.py
│   ├── test_pipeline.py
│   ├── requirements.txt
│   └── crop_db.db (SQLite database - consider adding to .gitignore)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── dist/
│   ├── node_modules/ (will be ignored via .gitignore)
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
├── app.js
├── index.html
├── style.css
├── CLAUDE.md
├── GIT_SETUP_INSTRUCTIONS.md
├── DEPLOYMENT_GUIDE.md
└── .gitignore (will be created)
```

## Recommended .gitignore

Create a `.gitignore` file in the root directory with:

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.pyo
*.pyd
*.pyc
*.pyo
*.pyd
*.cover
*.log
*.sqlite3
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Build outputs
dist/
build/
*.pyc

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Database (if you don't want to version the SQLite DB)
*.db
*.sqlite

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## Important Notes

1. **Database File**: The SQLite database (`crop_db.db`) may contain sensitive data. Consider adding `*.db` to `.gitignore` if you don't want to version it.

2. **Node Modules**: The `node_modules` directory is large and can be regenerated with `npm install`, so it should be ignored.

3. **Python Dependencies**: Others can recreate the Python environment with `pip install -r requirements.txt`

4. **Model Files**: If you have trained ML models (.pt, .pth, .json files), make sure they're included unless they're too large for GitHub (>100MB per file).

## After Pushing

Once your code is on GitHub:
1. Others can clone with: `git clone https://github.com/your-username/agri-shield-crop-ai.git`
2. To run: 
   - Backend: `cd backend && pip install -r requirements.txt && python -m uvicorn app.main:app --reload`
   - Frontend: `cd frontend && npm install && npm run dev`
3. Visit http://localhost:8000 for API docs and http://localhost:5173 for frontend

## Troubleshooting

- **Authentication issues**: Use a [Personal Access Token](https://github.com/settings/tokens) instead of password
- **Large files**: Use Git LFS for files >100MB or consider GitHub Releases for distribution
- **Permission denied**: Ensure you have write access to the repository
