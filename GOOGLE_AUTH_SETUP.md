# Setting Up Google Authentication for MailCraft

This guide will walk you through setting up Google OAuth authentication for your MailCraft application.

## Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"
5. Select "Web application" as the application type
6. Add a name for your OAuth client (e.g., "MailCraft Auth")
7. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000` (for development)
   - Your production domain if deployed (e.g., `https://your-domain.com`)
8. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://your-domain.com/api/auth/callback/google` (for production if deployed)
9. Click "Create"
10. You'll receive a client ID and client secret - save these for the next step

## Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Update the following variables with your Google OAuth credentials:

```
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

3. Generate a secure random string for the `NEXTAUTH_SECRET` variable:
   - You can use this command in terminal: `openssl rand -base64 32`
   - Set the generated value in your `.env.local` file:
   ```
   NEXTAUTH_SECRET=your-generated-secure-string
   ```

4. Set the `NEXTAUTH_URL` to your application URL:
   - For development: `NEXTAUTH_URL=http://localhost:3000`
   - For production: `NEXTAUTH_URL=https://your-domain.com`

## Enable Required Google APIs

1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - Google People API (for accessing user profile information)
   - Gmail API (if you plan to integrate with Gmail)

## Testing Authentication

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000/login`
3. Click the "Continue with Google" button
4. You should be redirected to Google's login page
5. After successful authentication, you'll be redirected back to your application

## Troubleshooting

### "Error: redirect_uri_mismatch"
- Make sure the redirect URI in your Google Cloud Console matches exactly with your application's callback URL
- Check that `NEXTAUTH_URL` is correctly set in your environment variables

### "Invalid client secret"
- Verify that you've copied the client secret correctly from Google Cloud Console
- Ensure there are no extra spaces or characters in your `.env.local` file

### "Invalid token response"
- Check that your Google Cloud project has the required APIs enabled
- Verify that your application is using the correct scopes for authentication

## Production Deployment

When deploying to production:

1. Update your redirect URIs in Google Cloud Console to include your production domain
2. Set environment variables in your hosting provider's dashboard
3. Ensure `NEXTAUTH_URL` points to your production domain
4. Consider using a more secure way to store your secrets depending on your hosting provider 