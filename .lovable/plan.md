Add a prominent "Start tracking" CTA on the home page that routes users to the pregnancy tracker if signed in, or to sign-in (with a redirect to the pregnancy tracker) if not.

## Changes

### `src/routes/index.tsx`
- In the **Hero** CTA row, replace the existing primary button with a **"Start tracking"** button.
  - If `signedIn` is `true` → `<Link to="/pregnancy">`
  - If `signedIn` is `false` or `null` → `<Link to="/auth" search={{ next: "/pregnancy" }}>`
- Keep the secondary button as-is (guest option when not signed in, or keep dashboard link when signed in — whichever makes more sense visually).
- In the **Closing CTA** section, also update the primary button to say "Start tracking" with the same routing logic so the bottom-of-page CTA is consistent.

No new routes, pages, database tables, or server functions are required.