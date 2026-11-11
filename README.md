# DevForum Next.js UI

A production-oriented Next.js App Router + TypeScript frontend scaffold for the DevForum API.

## Stack
- Next.js App Router
- TypeScript
- Redux Toolkit + RTK Query
- Tailwind CSS v4
- React Hook Form/Zod-ready
- Lucide icons
- HttpOnly-cookie compatible API requests (`credentials: include`)

## Run

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_URL` to your backend, e.g. `http://localhost:8080/api/v1`.
3. Install dependencies: `npm install`
4. Start: `npm run dev`

## Backend authentication requirement

For HttpOnly cookie auth, the backend should set the JWT as an HttpOnly cookie during login, clear it on logout, and update the JWT filter to read the cookie when no Authorization header exists. Because cookies are ambient credentials, add CSRF protection (recommended: synchronizer token or double-submit token) for state-changing requests. If the browser calls Spring directly, enable CORS credentials for the exact frontend origin. Never combine credentials with wildcard origins. Also restrict WebSocket allowed origins instead of `*`.

The UI currently maps the resource/feed/comments/bookmarks/follow/notification endpoints discovered in the supplied API project. Auth endpoint paths may need to be aligned with the exact authentication controller in your backend.


## HttpOnly authentication
The UI never reads the access JWT. RTK Query uses `credentials: include`. The API sets `access_token` as HttpOnly and exposes `/auth/csrf`; state-changing requests automatically obtain the CSRF token and send `X-XSRF-TOKEN`.
