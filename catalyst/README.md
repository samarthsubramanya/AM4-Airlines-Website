# Zoho Catalyst sign-in

Indian.com can use [Zoho Catalyst Embedded Authentication](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/native-catalyst-authentication/embedded-authentication/setup-embedded-auth/) instead of the built-in demo login.

## How it works

1. `/login` loads Catalyst's Web SDK and `<CATALYST_APP_URL>/__catalyst/sdk/init.js`, then mounts the hosted sign-in form with `catalyst.auth.signIn("catalyst-login", { service_url })`.
2. After signing in, Catalyst redirects back to `/login?catalyst=done`.
3. The frontend calls the `auth_bridge` function here (`GET /server/auth_bridge/token`, with cookies). It reads the current user via `userManagement().getCurrentUser()` and returns a 12-hour JWT signed with `AUTH_JWT_SECRET`.
4. The Express API verifies that JWT exactly like a demo token. Miles and trips are stored against `catalyst:<user_id>`.

## Setup

1. Create a Catalyst project, then turn on **Authentication → Embedded Authentication** (Conventional or Social login).
2. Under **Authorized Domains**, add your frontend domain (e.g. `https://indian-com.vercel.app`) and enable CORS and iFrame access.
3. Deploy this function from the repo's `catalyst/` folder with the Catalyst CLI:
   ```bash
   npm i -g zcatalyst-cli
   ```
   ```bash
   catalyst login
   ```
   ```bash
   catalyst init   # choose your project and Functions; keep functions/auth_bridge
   ```
   ```bash
   catalyst deploy --only functions
   ```
4. In the Catalyst console, set the function's environment variables:
   - `AUTH_JWT_SECRET`: the same secret the Render API uses
   - `ALLOWED_ORIGINS`: your frontend origin(s), comma separated
5. On Vercel, set `NEXT_PUBLIC_CATALYST_APP_URL` to your Catalyst app domain (e.g. `https://indiancom-12345.development.catalystserverless.com`) and redeploy. The site switches from demo login to Catalyst automatically.

## Caveats

- Catalyst's docs show the init script served from the app's own domain (`/__catalyst/sdk/init.js`). Loading it from an external domain depends on the Authorized Domains setting. If your browser blocks the cross-site session cookie, host the Next.js export on Catalyst Web Client Hosting, or put both behind one custom domain.
- I couldn't test this path end to end without a Catalyst project. Treat it as a starting point and check it against the Catalyst console once you have keys.
