# OmarPOS v4 — Windows Desktop

OmarPOS is a Windows desktop POS application with a centralized subscription/licensing foundation.

## Windows
1. Install Node.js LTS.
2. Run `npm install`.
3. Run `npm start` for development.
4. Run `npm run dist` to build Windows installers.
5. Run `npm run dist:portable` for a portable build.

## Central licensing
The `license-server/` directory contains the central licensing API. Customer passwords are stored as bcrypt hashes. Subscriptions support 7 days, monthly, yearly, and lifetime plans, plus active/suspended states and expiry checks.

## Security
Never commit real passwords, admin credentials, database files, or `.env` files. Use `license-server/.env.example` as a template and configure secrets in the deployment environment.

The current repository contains the licensing API foundation; deployment of the license server and a full web admin dashboard are separate deployment steps.
