# Cloudflare Pages Deployment

This project is prepared for the GitHub -> Cloudflare Pages workflow.

## Recommended Production Flow

1. Push this repository to GitHub.
2. In Cloudflare Dashboard, open `Workers & Pages`.
3. Create a new Pages project from Git.
4. Select this repository.
5. Use these build settings:

```txt
Project name: kiraequal
Production branch: master
Build command: npm run build
Build output directory: out
Root directory: /
Environment variable: NODE_VERSION=22
```

If the GitHub repository root is the parent folder and this app is inside
`equal-next`, set the Pages root directory to `equal-next` instead.

## Why Pages Instead Of GitHub Pages

GitHub still remains the source repository. Cloudflare Pages becomes the
hosting and edge runtime layer, so the generated `_worker.js` can run and serve
Markdown responses for agent requests.

The build exports:

- `out/_worker.js` for Cloudflare Pages Advanced Mode.
- `out/_headers` for Link headers and content signals.
- `out/robots.txt` with `Content-Signal`.
- `out/.well-known/api-catalog` and related discovery files.
- `out/ai/*.md` Markdown mirrors.

## Local Verification

Run:

```txt
npm run build
npm run pages:verify
```

Direct upload is available after Cloudflare authentication:

```txt
npm run pages:deploy
```

The direct upload command uses:

```txt
npx wrangler pages deploy out --project-name kiraequal
```

In this Codex environment, Wrangler is non-interactive. To use direct upload
from here, set a Cloudflare API token before running `npm run pages:deploy`:

```txt
CLOUDFLARE_API_TOKEN=...
```

The token needs permission to create/read/deploy Cloudflare Pages projects for
the account. If you prefer not to create a token, use the Dashboard Git
integration flow instead.

## Git Remote Requirement

The Cloudflare Pages Git integration needs this project pushed to GitHub first.
Check with:

```txt
git remote -v
```

If no remote is configured, create a GitHub repository and add it:

```txt
git remote add origin git@github.com:YOUR_ACCOUNT/YOUR_REPO.git
git push -u origin master
```

## Custom Domain

After the first Pages deployment succeeds:

1. Open the Pages project in Cloudflare.
2. Go to `Custom domains`.
3. Select `Set up a domain`.
4. Add `kiraequal.org`.
5. Let Cloudflare create or replace the DNS record.

Do not only add a manual CNAME. Cloudflare Pages needs the custom domain
attached to the Pages project.

## DNS-AID

DNS-AID records cannot be published by static site files. Use the example in:

```txt
public/.well-known/dns-aid.example.txt
```

Then publish supported SVCB/HTTPS records in Cloudflare DNS and enable DNSSEC
for the zone.
