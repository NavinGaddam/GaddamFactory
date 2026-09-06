# Gaddam Factory

Gaddam Factory is a mobile-first textile factory operations PWA built with Next.js, Firebase Authentication and Firestore, designed for Vercel deployment.

## Roles
Owner, Manager, Worker and Watchman. Owner access starts with `vsshegur@gmail.com` and additional owners can be granted access from the app.

## Operations
Goods inward, Pote/Bori and Box stock, yarn types, batches, worker payment basis (hour/KG/task), attendance, payroll workflow, reports and an append-only owner logbook.

## Defaults
Pote/Bori package weights: 50 kg and 60 kg. Timezone: Asia/Kolkata. Languages: Marathi and English. Light/dark mode and PWA support are included.

## Firebase
Set the `NEXT_PUBLIC_FIREBASE_*` values in Vercel Project Settings → Environment Variables. Never commit private credentials or service-account keys.
