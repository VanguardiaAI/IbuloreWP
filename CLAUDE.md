# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IbuloreWP is a custom WooCommerce administration panel for a Santería Yoruba religious products store. It consists of:
- **Frontend**: Next.js 15 admin dashboard with React 19, TypeScript, and Shadcn/UI
- **Backend**: Flask API server that interfaces with WordPress/WooCommerce
- **Integration**: WordPress REST API and WooCommerce API for data management

## Key Commands

### Frontend Development (in `/frontend` directory)
```bash
npm install      # Install dependencies
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linting
```

### Backend Development (in `/backend` directory)
```bash
pip install -r requirements.txt    # Install dependencies
python app.py                      # Start main API server (port 5001)
python start_blog_dev.py          # Start blog API development server
python start_comments_dev.py      # Start comments API development server
```

### Running Tests (in `/backend` directory)
```bash
python test_all_endpoints.py      # Test all API endpoints
python test_blog_api.py           # Test blog functionality
python test_comments_api.py       # Test comments system
python test_categories_hierarchy.py  # Test category hierarchy
```

## Architecture & Structure

### Frontend (`/frontend/src`)
- **app/**: Next.js app router pages and API routes
  - `dashboard/`: Admin panel pages (products, orders, customers, blog, etc.)
  - `api/ai/`: AI generation endpoints for content and images
- **components/**: React components organized by feature
  - `ui/`: Shadcn/UI components
  - `blog/`, `products/`, `orders/`, etc.: Feature-specific components
- **lib/**: Utilities, API client, currency handling
- **hooks/**: Custom React hooks

### Backend (`/backend`)
- **app.py**: Main Flask application
- **routes/**: API route modules
  - `products.py`, `orders.py`, `customers.py`, `blog.py`, etc.
- **utils/**: Helper functions and API wrappers
  - `woocommerce_api.py`: WooCommerce API client
  - `wordpress_api.py`: WordPress REST API client

## API Architecture

The Flask backend provides REST endpoints that proxy and enhance WordPress/WooCommerce functionality:
- All endpoints prefixed with `/api/`
- Authentication via WordPress Application Passwords
- CORS enabled for frontend communication
- Enhanced with custom features (AI content generation, bulk operations)

### Key API Endpoints
- `/api/products` - Product management with AI photo generation
- `/api/orders` - Order processing and management
- `/api/customers` - Customer data and analytics
- `/api/categories` - Category hierarchy management
- `/api/blog` - Blog posts, categories, tags, comments
- `/api/orishas` - Custom product attributes for religious items
- `/api/media` - WordPress media library integration

## Important Features

### Multi-Currency Support
The system supports multiple currencies (MXN, USD, EUR, GBP, CAD, COP, ARS) with:
- Automatic detection from WooCommerce data
- Regional formatting and locale-specific display
- Tax rates and shipping costs per currency
- Visual indicators in the UI

### AI Integration
- OpenAI API for blog content generation
- AI-powered product photo generation
- Requires `OPENAI_API_KEY` in environment variables

### Blog System
- Full WordPress blog integration
- Rich text editing with CKEditor 5
- SEO optimization (meta tags, Open Graph)
- Comment moderation system
- Media upload functionality

## Environment Configuration

Required environment variables (create `.env` file in `/backend`):
```
WC_STORE_URL=https://your-store.com
WC_CONSUMER_KEY=ck_...
WC_CONSUMER_SECRET=cs_...
WP_USER_LOGIN=your-username
WP_APPLICATION_PASSWORD=your-app-password
OPENAI_API_KEY=sk-... (optional, for AI features)
```

## Development Tips

1. **When modifying API endpoints**: Update both the Flask route and the corresponding frontend API client in `/frontend/src/lib/api.ts`

2. **For UI components**: Use existing Shadcn/UI components from `/frontend/src/components/ui/` and follow the established patterns

3. **Testing changes**: Run relevant test scripts after modifications, especially for category hierarchy and blog features

4. **Currency handling**: Use the currency utilities in `/frontend/src/lib/currency.ts` for consistent formatting

5. **Error handling**: The API returns standardized error responses; handle them consistently in the frontend

## Common Issues

1. **CORS errors**: Ensure the Flask server is running and CORS is properly configured
2. **Authentication failures**: Verify WordPress Application Password is correctly set
3. **Missing dependencies**: Run install commands in both frontend and backend directories
4. **Port conflicts**: Backend runs on 5001, frontend on 3000 by default