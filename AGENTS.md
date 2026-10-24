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
- Public community chat lives in the `community_messages` table (anyone reads, realtime); only signed-in accounts can post, and a BEFORE INSERT trigger stamps `user_id` and the profile's display name so names can't be faked. Rows with no `user_id` are bot or legacy messages.
- Accounts use username + password only: `src/lib/username.ts` maps each username to a fixed internal email (auto-confirm on), and a trigger fills `public.profiles` from signup metadata; email-based password reset is not possible by design.
- Session state comes from one `AuthProvider` (`src/lib/auth-context.tsx`) in `__root.tsx`; it owns the only `onAuthStateChange` listener.
- The owner area is `/owner` (dashboard: counts, chat moderation, members) plus `/owner/bot` (command bot). Access is the shared password (server secrets, encrypted cookie) or a signed-in account with the `owner` role in `public.user_roles`; every server function in `src/lib/owner.functions.ts` re-checks access, bot parsing lives in `src/lib/bot-parse.ts`, and owner-added text commands live in `public.bot_commands` (service-role only).
- Owner tags next to names come from the public `owner_ids()` function via `useOwnerIds()`/`OwnerTag` (`src/components/owner-tag.tsx`); the tag word lives in `src/lib/owner-tag-label.ts` and is shared with the bot's text replies.
