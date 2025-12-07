# RFP API

A comprehensive Request for Proposal (RFP) management system built with NestJS. This API enables organizations to generate RFPs using AI, manage vendors, send RFP invitations via email, receive proposals, and compare them using AI-powered analysis.

## 🚀 Features

- **AI-Powered RFP Generation**: Generate structured RFPs from natural language descriptions using Azure OpenAI
- **Vendor Management**: Register and manage vendor information
- **Email Integration**: 
  - Send RFP invitations to vendors via email
  - Automatically fetch and process vendor proposals from email inbox (IMAP)
- **Proposal Management**: Track and manage vendor proposals
- **AI Proposal Comparison**: Automatically compare multiple proposals using AI analysis
- **MongoDB Integration**: Persistent storage for RFPs, vendors, and proposals

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Yarn** (v3.6.4 or higher) - This project uses Yarn 3
- **MongoDB** (local installation or MongoDB Atlas account)
- **Azure OpenAI** account with API access
- **Email Account** with IMAP/SMTP access (Gmail, Outlook, etc.)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/StanPrajwal/RFP_API
cd RFP_API
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=8000

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/rfp_db
# For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/rfp_db?retryWrites=true&w=majority

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=your_deployment_name

# Email Configuration (SMTP - for sending emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# IMAP Configuration (for receiving emails)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
```

#### Environment Variables Explained:

- **PORT**: The port on which the server will run (default: 8000)
- **MONGO_URI**: MongoDB connection string
- **AZURE_OPENAI_***: Azure OpenAI service credentials
  - Get your API key from Azure Portal
  - Endpoint format: `https://<your-resource-name>.openai.azure.com`
  - Deployment name is the model deployment you created in Azure
- **EMAIL_***: SMTP settings for sending emails
  - For Gmail, you'll need to generate an [App Password](https://support.google.com/accounts/answer/185833)
- **IMAP_***: IMAP settings for receiving emails
  - For Gmail: `imap.gmail.com:993`
  - For Outlook: `outlook.office365.com:993`

### 4. MongoDB Setup

#### Option A: Local MongoDB

1. Install MongoDB locally or use Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

2. Update `MONGO_URI` in `.env`:
```env
MONGO_URI=mongodb://localhost:27017/rfp_db
```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string and update `.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/rfp_db?retryWrites=true&w=majority
```

## 🏃 Running the Application

### Development Mode

```bash
yarn run start:dev
```

The application will start on `http://localhost:8000` (or the port specified in your `.env` file).

### Production Mode

First, build the application:

```bash
yarn run build
```

Then run the production server:

```bash
yarn run start:prod
```

### Debug Mode

```bash
yarn run start:debug
```

## 📡 API Endpoints

### RFP Endpoints

#### Generate RFP (AI)
```http
POST /rfp/generate-rfp
Content-Type: application/json

{
  "description": "I need a web development project with 10 pages, responsive design, and modern UI"
}
```

#### Create RFP
```http
POST /rfp/create
Content-Type: application/json

{
  "title": "Web Development Project",
  "descriptionRaw": "Raw description text",
  "descriptionStructured": {
    "items": [],
    "currency": "USD",
    "currencySymbol": "$",
    "budget": 50000,
    "deliveryTimeline": "3 months",
    "paymentTerms": "50% upfront, 50% on completion",
    "warranty": "1 year"
  }
}
```

#### Get RFP by ID
```http
GET /rfp/fetch-rfp/:id
```

#### Get All RFPs
```http
GET /rfp/fetch-all-rfp
```

#### Assign Vendors to RFP
```http
POST /rfp/:id/vendors
Content-Type: application/json

{
  "vendorIds": ["vendor_id_1", "vendor_id_2"]
}
```

#### Send RFP to Vendors
```http
POST /rfp/:id/send
Content-Type: application/json

{
  "vendorIds": ["vendor_id_1", "vendor_id_2"]
}
```

#### Get Proposals for RFP
```http
GET /rfp/:id/proposals
```

#### Compare Proposals (AI)
```http
GET /rfp/:id/compare
```

### Vendor Endpoints

#### Register Vendor
```http
POST /vendor/register-vendor
Content-Type: application/json

{
  "name": "ABC Solutions",
  "email": "contact@abcsolutions.com",
  "address": "123 Main St, City, State",
  "phone": "+1-234-567-8900"
}
```

#### Get All Vendors
```http
GET /vendor/fetch-vendors
```

## 📁 Project Structure

```
RFP_API/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── modules/
│   │   ├── database/           # MongoDB database configuration
│   │   ├── mail/              # Email service (SMTP & IMAP)
│   │   │   └── templates/     # Email templates
│   │   ├── openai/            # Azure OpenAI integration
│   │   ├── rfp/               # RFP management module
│   │   └── vendor/            # Vendor management module
│   └── schemas/               # MongoDB schemas
│       ├── rfp.schema.ts
│       ├── vendor.schema.ts
│       ├── proposal.schema.ts
│       └── email-inbound.schema.ts
├── dist/                      # Compiled JavaScript (generated)
├── test/                      # E2E tests
├── package.json
├── tsconfig.json
└── .env                       # Environment variables (create this)
```

## 🧪 Testing

### Run Unit Tests

```bash
yarn run test
```

### Run E2E Tests

```bash
yarn run test:e2e
```

### Run Tests with Coverage

```bash
yarn run test:cov
```

## 🔧 Technologies Used

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Azure OpenAI** - AI-powered RFP generation and proposal comparison
- **Nodemailer** - Email sending (SMTP)
- **IMAP** - Email receiving
- **Handlebars** - Email template engine
- **@nestjs/schedule** - Cron jobs for email fetching

## 📝 Key Features Explained

### 1. AI RFP Generation
The system uses Azure OpenAI to convert natural language descriptions into structured RFP documents with items, budget, timeline, and payment terms.

### 2. Email Automation
- **Outbound**: Sends formatted RFP invitations to vendors using HTML email templates
- **Inbound**: Automatically checks email inbox (via IMAP) for vendor proposals and processes them

### 3. Proposal Comparison
Uses AI to analyze and compare multiple vendor proposals, providing insights on pricing, features, and recommendations.

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongosh` or check Docker container
- Verify `MONGO_URI` in `.env` is correct
- Check network connectivity for MongoDB Atlas

### Email Sending Issues
- For Gmail: Use App Password (not regular password)
- Enable "Less secure app access" or use OAuth2
- Check firewall settings for SMTP port (587)

### IMAP Connection Issues
- Ensure IMAP is enabled in your email account settings
- For Gmail: Enable IMAP in account settings
- Verify IMAP credentials match SMTP credentials

### Azure OpenAI Issues
- Verify API key is correct
- Check endpoint URL format
- Ensure deployment name matches your Azure deployment
- Verify API version is supported

## 🔒 Security Notes

- Never commit `.env` file to version control
- Use environment variables for all sensitive data
- In production, restrict CORS origins in `main.ts`
- Use strong passwords and API keys
- Enable MongoDB authentication in production

---

**Note**: Make sure all environment variables are properly configured before running the application. The application will not start without proper MongoDB and Azure OpenAI configuration.
