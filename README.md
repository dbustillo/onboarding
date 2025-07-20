# Inspire E-Commerce Solutions - Quote Builder with AI Assistant

A modern, responsive quote builder application with integrated AI chatbot and client onboarding platform for Inspire E-Commerce Solutions.

## Features

### Quote Builder
- **Warehousing Services**: Ambient and temperature-controlled storage with tier-based pricing
- **Fulfillment Services**: Volume-based pick, pack, and ship services
- **Shipping Integration**: J&T Express direct-to-consumer shipping rates
- **Real-time Cost Calculation**: Dynamic pricing with VAT toggle
- **PDF Quote Generation**: Professional quote documents
- **Mobile Responsive**: Optimized for all device sizes

### Client Onboarding Platform
- **Dual Interface**: Separate portals for clients and administrators
- **Role-Based Access**: Secure authentication with approval workflow
- **Onboarding Workflows**: Task management based on your spreadsheet breakdown
- **Google Drive Integration**: Direct access to forms, sheets, and documents
- **DocuSign Integration**: Contract management and e-signature workflow
- **Progress Tracking**: Real-time onboarding status and milestone tracking
- **In-App Notifications**: Task updates and communication system

### AI Chatbot Widget
- **OpenAI Assistant Integration**: Connects to custom GPT assistant
- **Contextual Help**: Answers questions about services, pricing, and SLA
- **Beautiful UI**: Gradient design with animations and micro-interactions
- **Mobile Optimized**: Responsive chat interface
- **Real-time Messaging**: Instant responses with typing indicators

## Setup Instructions

### 1. Supabase Database Setup

Create a new Supabase project and configure the database:

1. Go to [Supabase](https://supabase.com) and create a new project
2. Navigate to Settings → API in your Supabase dashboard
3. Copy your Project URL and anon public key
4. Update the `.env.local` file with your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

5. Run the database migration:
```bash
npx supabase db push
```

Or manually run the SQL migration file in your Supabase SQL editor.

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_ASSISTANT_ID=asst_im1FzfzvyezWJY0ekuFnB0NV
```

### 3. OpenAI Assistant Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key in the API Keys section
3. Your assistant ID is already configured: `asst_im1FzfzvyezWJY0ekuFnB0NV`

### 4. Development Mode

The chatbot currently runs in development mode with mock responses. To enable full OpenAI integration:

1. Add your OpenAI API key to `.env.local`
2. Uncomment the real API call in `src/components/ChatWidget.tsx`
3. Comment out the mock response section

### 5. Production Deployment

For production deployment, you'll need to:

1. Set up a backend API endpoint to handle OpenAI requests (for security)
2. Configure environment variables on your hosting platform
3. Update the API endpoint in the ChatWidget component

## Database Schema

The platform uses a comprehensive database schema with 8 core tables:

- **profiles**: User accounts with role-based access (client/admin)
- **quote_submissions**: Integration with existing quote builder
- **onboarding_templates**: Workflow templates based on your task breakdown
- **client_onboarding**: Individual client onboarding instances
- **onboarding_tasks**: Detailed task management from your spreadsheet
- **google_drive_resources**: Google Drive integration for forms/documents
- **contracts**: DocuSign contract tracking and management
- **notifications**: In-app notification system

## Technical Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **jsPDF** for quote generation
- **Vite** for build tooling
- **Supabase** for database and authentication
- **React Router** for navigation

### Backend
- **Supabase** for database, authentication, and real-time features
- **Row Level Security (RLS)** for data protection
- **PostgreSQL** with comprehensive indexing
- **Real-time subscriptions** for live updates

### AI Integration
- **OpenAI Assistants API** for intelligent responses
- **Custom GPT Assistant** trained on company data
- **Thread-based conversations** for context retention
- **Error handling** with fallback responses

### Integrations
- **Google Drive API** for document management
- **DocuSign API** for contract workflows
- **Supabase Realtime** for live notifications

### Components Structure
```
src/
├── components/
│   ├── auth/                   # Authentication components
│   ├── client/                 # Client dashboard
│   ├── admin/                  # Admin dashboard
│   ├── layout/                 # Layout components
│   ├── setup/                  # Setup and configuration
│   ├── ChatWidget.tsx          # Main chatbot component
│   ├── steps/                  # Quote builder steps
│   └── ...
├── contexts/
│   └── AuthContext.tsx         # Authentication context
├── lib/
│   └── supabase.ts            # Supabase client and types
├── utils/
│   ├── openaiService.ts        # OpenAI API integration
│   └── pricingEngine.ts        # Quote calculations
└── supabase/
    └── migrations/             # Database migrations
```

## Current Implementation Status

### ✅ Phase 1 Complete: Foundation & Authentication
- Database schema with RLS policies
- User authentication and role management
- Account approval workflow
- Dual interface (client/admin portals)
- Professional UI matching quote builder aesthetic

### 🚧 Phase 2 Next: Onboarding Workflow Engine
- Task breakdown implementation
- Dynamic workflow generation
- Progress tracking system
- Client-admin communication

### 📋 Upcoming Phases
- **Phase 3**: Google Drive Integration
- **Phase 4**: DocuSign Integration
- **Phase 5**: Enhanced Interfaces
- **Phase 6**: Notifications & Reporting

## Customization

### Chatbot Appearance
- Colors and gradients can be modified in `ChatWidget.tsx`
- Animation timing and effects in the component styles
- Position and size adjustments for different screen sizes

### AI Responses
- Assistant behavior is controlled by the OpenAI Assistant configuration
- Custom instructions and knowledge base can be updated in OpenAI platform
- Fallback responses can be modified in the error handling sections

### Widget Configuration
- Widget visibility can be controlled via props
- Position and styling can be customized
- Integration points can be added throughout the application

### Database Customization
- Modify onboarding templates to match your workflow
- Customize task categories and priorities
- Add custom fields to profiles and onboarding data

## Security Considerations

1. **API Key Protection**: Never expose OpenAI API keys in frontend code
2. **Rate Limiting**: Implement rate limiting for API calls
3. **Input Validation**: Sanitize user inputs before sending to OpenAI
4. **Error Handling**: Graceful degradation when AI services are unavailable
5. **Row Level Security**: Database access controlled by user roles
6. **Authentication**: Secure user management with Supabase Auth
7. **Data Protection**: Encrypted data transmission and storage

## Support

For technical support or questions about the implementation, contact the development team or refer to the OpenAI documentation for Assistant API integration.