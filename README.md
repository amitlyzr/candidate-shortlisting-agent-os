<div align="center">
  <img src="./public/lyzr-logo.png" alt="Lyzr Logo" width="200"/>
  
  # Candidate Shortlisting Agent

  <p align="center">
    Streamline your recruitment process with AI-powered candidate evaluation and ranking
  </p>

  <p align="center">
    <a href="#features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#usage">Usage</a> •
    <a href="#tech-stack">Tech Stack</a>
  </p>
</div>

---

## Overview

The Candidate Shortlisting Application is an intelligent HR tool that leverages AI to automate and optimize the candidate evaluation process. Upload job descriptions and candidate resumes, generate custom evaluation rubrics, and let AI rank candidates based on job fit—all in one seamless workflow.

### Key Highlights

- **AI-Powered Rubric Generation**: Automatically create evaluation criteria tailored to each job description
- **Intelligent Candidate Matching**: Score and rank candidates using customizable weighted rubrics
- **Multi-Format Support**: Process PDF and DOCX files for both job descriptions and resumes
- **Session History**: Track and review past evaluations with detailed scoring breakdowns
- **Group Management**: Organize candidates into custom groups for easier management

## Features

### 🎯 Smart Candidate Evaluation

- Generate up to 3 custom evaluation rubrics per job description
- Edit and fine-tune rubric weightages and criteria
- Parallel processing of multiple candidates with real-time progress tracking
- Detailed scoring with AI-generated justifications for each criterion

### 📄 JD Library

- Upload and manage job descriptions in PDF or DOCX format
- Automatic content parsing and extraction
- Filter and search through your job description library
- View full JD content and metadata

### 👥 Candidate Database

- Upload candidate resumes (PDF/DOCX)
- Organize candidates into custom groups
- Extract key information: name, role, company, location, experience
- Bulk selection and group-based filtering

### 📊 Session Management

- Review previous evaluation sessions
- View top-ranked candidates for each session
- Access detailed scoring breakdowns
- Track evaluation history with timestamps

### 🎨 Modern User Experience

- Clean, intuitive interface built with Shadcn UI
- Dark/Light theme support
- Interactive guided tours for first-time users
- Responsive design for all screen sizes

## Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **MongoDB** database (MongoDB Atlas recommended)
- **Lyzr API Key** with access to AI agents

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/amitlyzr/candidate-shortlisting-agent-os.git
cd candidate-shortlisting-agent
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://your-mongodb-connection-string

# Lyzr AI Configuration
LYZR_CANDIDATES_AGENT_ID=your-agent-id
LYZR_EVALUATE_CANDIDATES_AGENT_ID=your-agent-id
LYZR_RUBRICS_AGENT_ID=your-agent-id
```

> [!TIP]
> You can obtain your Lyzr agent IDs from the [Lyzr Studio Dashboard]

4. **Initialize the database**

```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**

```bash
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### 1. Upload Job Descriptions

Navigate to the **JD Library** and upload your job descriptions. The system supports PDF and DOCX formats and automatically extracts relevant content.

### 2. Add Candidates

Go to the **Candidate Database** and upload candidate resumes. Organize them into groups for better management (e.g., by department, skill level, or recruitment campaign).

### 3. Generate Evaluation Rubrics

On the **Shortlist** page:
1. Select a job description from your library
2. Click "Generate Rubrics" to create AI-powered evaluation criteria
3. Review the 3 generated rubrics (Basic, Intermediate, Advanced)
4. Edit weightages and criteria as needed
5. Confirm your preferred rubric

### 4. Evaluate Candidates

1. Select candidates from your database (individual or group selection)
2. Click "Match & Rank Candidates" to start the evaluation
3. Monitor real-time progress as AI evaluates each candidate
4. Review ranked results with detailed scores and justifications

### 5. Review Sessions

Access the **Sessions** page to review past evaluations, compare candidates across different rubrics, and export results for your hiring team.

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn UI** - Component library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **MongoDB** - NoSQL database

### AI & Processing
- **Lyzr Agent SDK** - AI agent orchestration
- **Mammoth.js** - DOCX file parsing
- **unpdf** - PDF content extraction

### Additional Tools
- **NextStepJS** - Interactive user onboarding
- **Recharts** - Data visualization
- **React Hook Form + Zod** - Form management and validation
- **Sonner** - Toast notifications

## Project Structure

```
candidate-shortlisting/
├── src/
│   ├── app/
│   │   ├── (app)/                    # Protected app routes
│   │   │   ├── page.tsx              # Main shortlisting page
│   │   │   ├── jd-library/           # Job description management
│   │   │   ├── candidate-database/   # Candidate management
│   │   │   └── sessions/             # Session history
│   │   ├── api/                      # API routes
│   │   │   ├── candidates/           # Candidate CRUD
│   │   │   ├── job-descriptions/     # JD CRUD
│   │   │   ├── generate-rubrics/     # AI rubric generation
│   │   │   └── evaluate-candidates/  # AI candidate evaluation
│   │   └── layout.tsx                # Root layout
│   ├── components/
│   │   ├── ui/                       # Reusable UI components
│   │   └── providers/                # Context providers
│   ├── lib/
│   │   ├── auth.ts                   # Authentication utilities
│   │   ├── prisma.ts                 # Database client
│   │   └── file-parser.ts            # Document parsing
│   └── hooks/                        # Custom React hooks
├── prisma/
│   └── schema.prisma                 # Database schema
└── public/                           # Static assets
```

## Authentication

The application uses a header-based authentication system where user credentials are passed via HTTP headers. Authentication is automatically handled by the `AuthProvider` and `authFetch` utility.

### Required Headers

All API requests must include the following headers:

- `x-user-id` - Unique user identifier
- `x-email` - User email address
- `x-org-id` - Organization identifier  
- `x-token` - Authentication token (used as Lyzr API key)

### Lyzr API Integration

The user's authentication token (`x-token`) is directly used as the API key for all Lyzr AI agent calls. This provides:

- **User-specific API access**: Each user's token is tied to their Lyzr account
- **Usage tracking**: API calls are tracked per user for billing and analytics
- **Security**: No shared API keys; each user has isolated access
- **Simplified setup**: No separate Lyzr API key configuration needed

> [!IMPORTANT]
> Ensure that user tokens are valid Lyzr API keys. Users must authenticate through a system that provides Lyzr-compatible tokens.

## API Endpoints

### Job Descriptions
- `GET /api/job-descriptions` - List all job descriptions
- `POST /api/job-descriptions` - Upload new job description
- `DELETE /api/job-descriptions?id={id}` - Delete job description

### Candidates
- `GET /api/candidates` - List all candidates
- `POST /api/candidates` - Upload new candidate
- `PATCH /api/candidates?id={id}` - Update candidate group
- `DELETE /api/candidates?id={id}` - Delete candidate

### Evaluation
- `POST /api/generate-rubrics` - Generate evaluation rubrics
- `POST /api/evaluate-candidates` - Evaluate and rank candidates

### Sessions
- `GET /api/sessions` - List evaluation sessions
- `GET /api/sessions/{sessionId}` - Get session details

## Development

### Running Tests

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

### Database Management

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

## Deployment

This application is optimized for deployment on **Vercel**, but can be deployed on any platform supporting Next.js.

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

> [!IMPORTANT]
> Ensure your MongoDB database is accessible from your deployment environment and all environment variables are properly configured.

## Best Practices

- Upload clear, well-formatted job descriptions for better rubric generation
- Organize candidates into logical groups before evaluation
- Review and adjust rubric weightages based on your hiring priorities
- Use the session history to compare different evaluation approaches
- Keep your candidate database up-to-date by removing outdated profiles

## Support

For issues, questions, or contributions:

- **Documentation**: [Lyzr Documentation](https://docs.lyzr.ai)
- **GitHub Issues**: [Report a bug](https://github.com/amitlyzr/candidate-shortlisting-agent/issues)
- **Email**: support@lyzr.ai

---

<div align="center">
  <p>Built with ❤️ using Lyzr AI</p>
  <p>
    <a href="https://lyzr.ai">Website</a> •
    <a href="https://github.com/amitlyzr">GitHub</a>
  </p>
</div>
