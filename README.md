This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on Netlify

### GitHub Setup
1. Create a new GitHub repository or use an existing one
2. Push this project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/mailcraft.git
   git push -u origin main
   ```

### Netlify Setup
1. Sign up or log in to [Netlify](https://app.netlify.com/)
2. Click "Add new site" > "Import an existing project" 
3. Select your GitHub repository
4. Configure build settings:
   - Build command: `npm ci && npm run build`
   - Publish directory: `.next`
5. Set up environment variables in Netlify's UI (Settings > Site settings > Environment variables):
   - `OPENAI_API_KEY`
   - `NEXTAUTH_URL` (your Netlify site URL)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
6. Deploy your site

For Google Auth to work properly, add your Netlify domain to the authorized redirect URIs in the [Google Cloud Console](https://console.cloud.google.com/).

### Environment Variables

This project uses environment variables for configuration. For local development, create a `.env.local` file in the project root with the following variables:

```
OPENAI_API_KEY=your-openai-api-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

For Netlify deployment, the app will read from `.env` file or from environment variables set in the Netlify UI. You can set these environment variables in the Netlify dashboard under Site settings > Build & deploy > Environment variables.
