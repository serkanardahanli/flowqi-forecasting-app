<<<<<<< HEAD
# FlowQi - Financial Forecasting SaaS

FlowQi is a powerful SaaS solution for financial forecasting and management, designed to help businesses of all sizes plan and track their financial future.

## Features

- **Multi-tenant Architecture**: Built for teams and multiple organizations
- **Financial Forecasting**: Create and manage detailed financial forecasts
- **Products & Services Management**: Track your products, services, and revenue streams
- **Expense Tracking**: Categorize and monitor all your business expenses
- **Team Management**: Role-based access control with admin and user permissions
- **Dashboard & Analytics**: Visualize your financial data with insightful charts and metrics

## Tech Stack

- **Frontend**: Next.js 14+, React 19+, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Authentication**: Supabase Auth (with Google and Microsoft providers)
- **Database**: PostgreSQL (via Supabase)
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Chart.js with React Chartjs 2

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn
- Supabase account

### Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/flowqi-forecasting-app.git
cd flowqi-forecasting-app
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```
# Create a .env.local file in the root directory with:
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the database migrations (found in `/supabase/migrations`)
   - Configure authentication providers (Google and Microsoft)

5. Run the development server
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following main database tables:

- **organizations** - Stores information about each organization/tenant
- **profiles** - User profiles linked to organizations
- **products** - Products or services offered by organizations
- **expense_categories** - Categories for expense tracking with GL codes
- **expenses** - Individual expense records
- **forecasts** - Forecast periods and metadata
- **forecast_items** - Individual forecast line items for revenue or expenses

## Multi-tenancy

The application is designed with multi-tenancy in mind:

- Each user belongs to an organization
- Data is scoped to the organization level
- Row-level security ensures data isolation between tenants
- Admin users can invite team members to their organization

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 
=======
# flowqi-forecasting-app
>>>>>>> 8624e5dd27ad475d1485d5666d0b01bf39269cc9
