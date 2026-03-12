# VNDG MCHN Web

This is the sibling marketing and web storefront application for the VNDG MCHN platform built with Next.js App Router and TailwindCSS.

## Local Development
1. Ensure `.env.local` exists in this `/web` directory and includes your Supabase keys:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. Run `npm install` 
3. Run `npm run dev`
4. Access the application on `http://localhost:3000`

## Verification & Build
To verify the application compiles correctly locally prior to deployment, execute:
`npm run build`

## Vercel Deployment
1. Connect this GitHub repository to your Vercel account.
2. During the project configuration, explicitly set the **Root Directory** to `web`. Next.js presets will apply automatically.
3. Inject both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` into the Vercel Environment Variables.
4. Deploy.

## Custom Domain Binding
To attach `vndgmchn.com`:
1. Navigate to Settings > Domains inside the Vercel project dashboard.
2. Add `vndgmchn.com` and `www.vndgmchn.com`.
3. Copy the Nameservers or the `A Record` (usually `76.76.21.21`) and configure them within your Registrar's DNS settings panel. Vercel will auto-provision SSL.
