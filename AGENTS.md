<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Server cards are written as literal JSX text in `src/routes/index.tsx` (via `ServerCard` slot components) so the owner can edit text directly with Visual Edits; keep card text as literal JSX children, not data arrays or string props.
- The site is Arabic, RTL (`dir="rtl"` on `<html>`); use logical spacing and mirror directional icons.
- Public community chat lives in the Lovable Cloud `community_messages` table (anon read/insert, realtime) so every visitor sees the same persistent messages without signing in.
- Accounts use username + password only: `src/lib/username.ts` maps each username to a fixed internal email (auto-confirm on), and a trigger fills `public.profiles` from signup metadata; email-based password reset is not possible by design.
- Session state comes from one `AuthProvider` (`src/lib/auth-context.tsx`) in `__root.tsx`; it owns the only `onAuthStateChange` listener.
- The owner panel (`/owner`) is a shared-password gate: password and cookie key live in server secrets, checked in `src/lib/owner.functions.ts`, and every panel read/delete re-checks the encrypted owner session server-side.
