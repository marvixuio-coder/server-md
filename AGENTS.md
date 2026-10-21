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
