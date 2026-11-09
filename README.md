# DeltaWay

*Bangladesh, guided.* A tourism marketplace for Bangladesh (repository: `bd-tourism`). International travelers browse destinations and tour packages, book with a step-by-step wizard, and pay online. For restricted areas (Chittagong Hill Tracts, Sundarbans) the platform collects passport details and handles government permits.

**Status:** tours, bookings, payments, permits, the admin panel, guide/host applications and guides (profiles, trip assignment, guide dashboard), homestays, reviews and payments in USD or BDT are built. Data and privacy work comes next.

## Features

- Destination and tour package pages, with region and permit information
- Sign up / sign in with email and password or Google, plus password reset by email
- 4-step booking wizard (dates → travelers → details → review) with permit-aware pricing
- Online payment through SSLCommerz in USD or BDT (bKash, Nagad, cards), verified server-side through the IPN webhook, with PDF receipts
- Email receipts through Resend
- Traveler dashboard: bookings, booking details, saved trips, profile
- Guide and homestay-host applications at `/apply/guide` and `/apply/host`, in English or Bangla, saved step by step so people can finish later
- Public guide profiles at `/guides`, filterable by region and language. Travelers can ask for a guide when booking
- Guide dashboard (English or Bangla): accept or decline trips, see traveler details once accepted, block days off, edit their profile and see earnings
- Homestays at `/homestays`: search by dates, guests, region and facilities, then book and pay for a stay. Prices are the host's rate plus DeltaWay's 15% fee, shown in BDT and USD
- Host dashboard (English or Bangla): upcoming guests with their details once paid, a calendar to close nights, listing editing with photos, and earnings
- Reviews after each trip or stay: a star rating and words for the tour or homestay, plus a separate rating for the guide. Ratings show on tour, homestay and guide pages and cards. Hosts can reply to reviews of their home

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 + shadcn/ui · PostgreSQL + Prisma 7 · NextAuth v5 · SSLCommerz · Resend

## Run it locally

You need **Node.js 20+** and **PostgreSQL** (pgAdmin is fine).

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Create your env file, then fill in DATABASE_URL and AUTH_SECRET at least
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env

# 3. Create the database tables and load the sample data
npm run db:deploy
npm run db:seed

# 4. Start the app → http://localhost:3000
npm run dev
```

Create an empty database called `bd_tourism` in pgAdmin first (or change the name in `DATABASE_URL`).

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Run the production build |
| `npm run lint` / `npm run typecheck` | Check code style / types |
| `npm run db:deploy` | Apply any new database migrations (safe, never deletes data) |
| `npm run db:migrate` | Create a new migration after changing `prisma/schema.prisma` |
| `npm run db:seed` | Load the sample destinations and tours |
| `npm run db:studio` | Browse the database in your browser |
| `npm run make-admin -- you@example.com` | Give an account admin access (add `--remove` to take it away) |

## Admin panel

Sign up on the site, then run `npm run make-admin -- your@email.com` and open **/admin**. From there the team can:

- confirm bookings, record bKash/bank/cash payments, cancel with a refund, and send refunds through SSLCommerz or record them
- track restricted-area permits (travelers see the status and get emails)
- add and edit tours (day-by-day itinerary), destinations (with photo gallery), regions and types
- review guide and host applications: a checklist (ID, phone, interview, references or home visit), private ID documents, team notes, and Approve, which turns the account into a guide or host
- create personal invite links for guides and hosts met offline and send them on WhatsApp or by email, and see who opened them
- assign a guide to each paid booking (with a check for days off and other trips), and record guide payouts
- manage homestay listings, record host payouts, and email the homestay waitlist when the first homes go live
- read every review, hide ones with personal details or abuse, and reply publicly
- read contact messages, export the homestay waitlist and manage user roles

Photos can be pasted as links from Unsplash, Pexels or Wikimedia Commons, or uploaded once the Cloudinary keys are set. Every admin action is kept in an activity log.

## Daily job

Vercel Cron calls `/api/cron/daily` once a day (see `vercel.json`). It cancels unpaid bookings that have passed their deadline, sends a single reminder email to anyone who left an application as a draft for two days, nudges guides (and the team) about trip requests left unanswered for a day, reminds hosts two days before guests arrive, and asks travelers for a review once their trip is over. Set `CRON_SECRET` in Vercel so only Vercel can call it. To run it locally:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily
```

## Payments: test and live

Payments run in **sandbox (test) mode** unless `SSLCOMMERZ_LIVE=true`, so no real money is taken by accident. Travelers choose USD or BDT; the taka amount is fixed when they start paying (rate from `NEXT_PUBLIC_BDT_PER_USD`, default 120), and the IPN checks the exact amount and currency. The callback URLs default to your site address. SSLCommerz must be able to reach `/api/webhooks/sslcommerz`, so payments only confirm on a public https address (or through a tunnel like ngrok). Admin → Settings shows a checklist, including the steps to go live once the trade licence and live store are ready. Without SSLCommerz keys, the pay page offers "pay via WhatsApp" and you record the payment by hand.

## Real photos

Destination photos can come from Wikimedia Commons: real photos of each place, shared under free licences. Run this on a computer with internet:

```bash
npm run photos:wikimedia -- --dry-run   # see what it would pick
npm run photos:wikimedia                # save them
```

Destinations still on an Unsplash placeholder get a Commons photo as their main image, and every destination gets up to 4 gallery photos. Tours on a placeholder take the photo of their first destination. Each photo's author and licence are saved, shown under the photo, and listed on `/credits`. Remove any photo you don't like from the destination in the admin. Add `--replace` to also replace main photos you set yourself.

## Testing invite links on your phone

Invite links use `NEXT_PUBLIC_APP_URL`. On your PC that's `http://localhost:3000`, which a phone can't open. Once the site is online, set it to the real address and links work anywhere. To try one on your own phone before that, with the phone on the same Wi-Fi:

```bash
ipconfig                              # Windows: note your IPv4 address, e.g. 192.168.0.105
npx next dev -H 192.168.0.105
```

Then open the admin at `http://192.168.0.105:3000` on the PC (not localhost). New invite links use that address and open on the phone. If Windows asks, allow Node.js through the firewall on private networks.

## Environment variables

All variables are listed and explained in [`.env.example`](.env.example). Locally, only `DATABASE_URL` and `AUTH_SECRET` are required. Without SSLCommerz keys the Pay button shows a "not configured" message, and without a Resend key emails are skipped (password-reset links are printed in the terminal instead).

## Project structure

```
prisma/                 schema, migrations, seed data
src/app/(marketing)/    public pages (home, destinations, packages, about, terms…)
src/app/(auth)/         login, signup, forgot / reset password
src/app/book/           booking wizard
src/app/dashboard/      traveler dashboard (sign-in required)
src/app/api/            NextAuth, payment callbacks, SSLCommerz webhook
src/components/         UI components
src/lib/                database client, server actions, payments, email
```
