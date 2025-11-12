# Supabase Integration Setup Guide

## Prerequisites
- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details:
   - **Name**: CattleOS (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste it into the SQL Editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. Verify success - you should see "Success. No rows returned"

## Step 3: Get API Credentials

1. In Supabase dashboard, go to **Settings** → **API** (left sidebar)
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

## Step 4: Configure Environment Variables

1. In your project root, create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: Never commit `.env.local` to git (it's already in `.gitignore`)

## Step 5: Enable Authentication (Optional but Recommended)

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** provider
3. Configure email templates if desired
4. For magic links: Enable "Confirm email" under Email Auth settings

## Step 6: Test the Connection

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Check the browser console - you should see no Supabase errors

## Step 7: Verify Database Access

1. Open your app in the browser
2. The app should now store data in Supabase instead of localStorage
3. Check Supabase dashboard → **Table Editor** to see data being created

## Current Data Storage

The app now uses Supabase for ALL data:
- ✅ Cattle records
- ✅ Pens and barns
- ✅ Weight records
- ✅ Health records
- ✅ Feed inventory
- ✅ Financial transactions

## Row Level Security (RLS)

The database is configured with RLS policies that ensure:
- Users can only see/edit their own data
- Data is automatically filtered by `user_id`
- Multi-tenant architecture built-in

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Check that `.env.local` exists and has correct values
- Restart your dev server after adding env variables

### Error: "Invalid API key"
- Verify you copied the **anon** key, not the service_role key
- Check for extra spaces or newlines in the key

### Data not showing up
- Check Supabase dashboard → **Table Editor**
- Verify RLS policies are enabled
- Check browser console for errors

### Authentication issues
- Ensure Email provider is enabled in Supabase
- Check Auth settings for redirect URLs

## Migration from localStorage

If you had existing data in localStorage, it will NOT automatically migrate.
The app now starts fresh with Supabase.

To preserve old data:
1. Export data manually before switching
2. Re-create records in the new Supabase-backed app

## Next Steps

1. ✅ Complete this setup
2. Set up authentication for user accounts
3. Deploy to production (Vercel recommended)
4. Configure Supabase production environment
5. Set up database backups

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Project Issues: Create an issue in your repo

## Security Notes

- Never expose `service_role_key` in client-side code
- Always use RLS policies for data access control
- Enable MFA for your Supabase account
- Use environment variables for all secrets
- Review Supabase security checklist: https://supabase.com/docs/guides/platform/going-into-prod
