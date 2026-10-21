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
- Discord server cards are data-driven from `src/lib/servers.ts`; edit that list rather than the page markup, so adding a server never touches layout code.
- The site is Arabic, RTL (`dir="rtl"` on `<html>`); use logical spacing and mirror directional icons.
