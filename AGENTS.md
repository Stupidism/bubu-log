# Repository Agent Rules

## Post-push Vercel Verification (Required)

- After every `git push` to any branch, always wait 2 minutes before checking deployment status.
- Then check Vercel build status for the related PR/deployment.
- If there is any deploy/runtime bug, fix it first, push again, and repeat this process.
- If there is no bug and deployment is successful, post the test preview link(s) in this chat thread.
- Do not skip this flow unless the user explicitly asks to skip it.

