# Trello Full Page Cards

A small Chrome extension that fills the browser tab with the Trello card view
and keeps up to two board columns open at a time.
Comments and activity stay on the right at widths of 1,100 px and above. Below
that width they appear after the card details and attachments. The whole view
scrolls together. Trello's close button, Escape key, menus, and editing stay native.
Descriptions always show their full contents, including embedded images.

Cards from the current list appear as horizontal buttons above the status and action row at
every screen size. The strip stays visible while scrolling the card. Scroll it
sideways when needed. Click a card to switch directly; the current card is
highlighted. There is no collapse control.
Hover over the strip and use the mouse wheel to scroll it horizontally. At
either end, wheel scrolling passes through to the page. Ctrl+wheel keeps
browser zoom, and horizontal trackpad scrolling stays native.
Each button shows its title on the first row, with member avatars and colored
labels on the second row and the card number (for example, **#2496**) aligned
to the right. Numbers come
from the loaded card links and are omitted when unavailable.
Long titles are shortened to one line; hover to see
the full title. Members and labels follow updates to the loaded board cards.
Drag a button before or after another button to change that card's position in
the Trello list. A blue marker shows the drop position. Drag near either edge
to scroll the strip. Trello's own drag handlers save the change; the strip
then follows the board order. Press Escape or drop outside the strip to cancel.
Keyboard: focus a button and press **Alt+Shift+Left/Right** to move it one place.
Reordering is available only when the underlying board card is draggable.
When you move the open card with Trello's list selector, the strip stays on the
original list and opens its next card. Moving the last card opens the previous
one. If no cards remain, the strip shows an empty message.

The navigation reads cards already loaded on the board, in board order. Open
cards from their board and clear board filters to include all cards. A direct
card link without the board loaded shows a hint instead of an incomplete list.

In an image preview, scroll the mouse wheel to zoom around the pointer. Click
and drag to pan. Images can grow beyond the viewport without being squeezed
back to fit. Double-click or press **0** to fit the image again. **+** and **-**
also zoom. Trello's close, download, and attachment navigation controls remain.

## Board columns

The first board list opens by default. Other lists appear as narrow vertical tabs
with their names and loaded card counts. Click a tab, or focus it and press
Enter/Space, to open that list. Up to two lists can stay open. Opening a third
closes the list that was opened first.

Drag a card from an open list onto a closed column to move it there. The target
highlights while dragging. Both open columns stay open after the drop, and
counts update. Empty columns also accept drops. Trello's native drag handlers
save the move; the extension makes no move requests. Drop position within a
closed list is controlled by Trello. Open the list to reorder its cards.

Counts include cards loaded on the board, so active board filters can reduce them.
Open lists are kept during card updates and reset when changing boards or
reloading the page. While a full-page card is open, the underlying board keeps
its native layout for the card navigation strip. Closing the card restores the selected columns.

## Install

1. Download the extension ZIP from [GitHub Releases](https://github.com/michalCapo/trello-full-page-cards/releases/latest) and extract it.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the extracted `extension` folder.
5. Reload any open Trello tabs, then open a card.

No build, account setup, or API key is needed. The extension only runs on
`https://trello.com/*`. It makes no network requests and stores no card data.

To restore Trello's original layout, disable the extension and reload Trello.
After changing the extension files, click **Reload** on its extension tile and
reload Trello.

## Release

Run `make` to list all available actions. With Python 3 installed, build just the
ZIP without GitHub access:

```sh
make build
```

To publish, install Git, GitHub CLI (`gh`), and Python 3, then sign in with
`gh auth login`. Set the version in `extension/manifest.json` and commit your
changes on `main`. Run either command:

```sh
./release
# or
make release
```

The command builds `dist/trello-full-page-cards-VERSION.zip` from the committed
extension and README, pushes `main` and the version tag, and publishes the ZIP
on GitHub Releases. Running it again for the same commit replaces the ZIP asset.
To release a different commit, use a new manifest version. The command stops if
there are uncommitted changes. After the new ZIP uploads successfully, the
command deletes older GitHub releases and their assets, keeping only the current
release.

## Layout compatibility

The extension uses Trello's current card dialog test ID and semantic `main` and
`aside` elements. It preserves the existing DOM so Trello controls keep their
event handlers. Image previews get wheel zoom and drag panning. Other dialogs
are left alone.
Trello can change its markup; if that happens, update the selectors in
`extension/content.js`, `extension/column-nav.js`, and `extension/board-columns.js`.

Chrome's [content scripts documentation](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
describes the extension mechanism used here.

## Validation

The shipped CSS and JavaScript were injected into a live, public Trello card
using Chromium. Checked layouts at 390, 800, 1,000, and 1,440 px; comments below
on narrow screens and beside the card on wide screens; no horizontal overflow;
and cleanup when closing the card. JavaScript syntax and manifest JSON checks
passed.

Image preview checks covered wheel events zooming beyond the viewport,
zooming around the pointer, mouse drag panning, the zoom limit, double-click
and keyboard reset, and closing the preview while keeping the card open.
A temporary, browser-only long-description probe verified 951 px of content
displayed fully, with both the fade overlay and expansion button hidden.
No test content was saved to Trello.

Version 1.2 checks covered switching between cards using the new list, selected
card highlighting, desktop and mobile list layouts at 1,249 and 390 px, no
horizontal overflow, and no browser errors. A temporary long-description probe
verified all 972 px of text remained visible with no gradient mask, fade, or
expansion toggle. This fixes the faded last lines on long descriptions.

Version 1.3 uses an always-open, sticky horizontal button strip. Checked card
switching, selected-button visibility after resizing, sticky positioning while
scrolling, and no horizontal page overflow at 390 px.

Version 1.3.3 DOM fixture checks covered moving the first, middle, last, and only
card; delayed insertion into the destination list; keeping the original list;
normal navigation; and resetting the list after closing and reopening the card.
Live Trello editing still needs a manual check.

Version 1.4 DOM fixture checks covered forwarding drag events to the board;
first, middle, last, and unchanged positions; canceling and dropping outside
the strip; keeping tabs intact during activity updates; keyboard moves and
focus; read-only cards; and cleanup when closing a card during a drag.
Wheel checks covered both directions, pixel/line/page deltas, scroll limits,
Ctrl+wheel, and horizontal trackpad events. Live Trello persistence still
needs a manual check on an editable board.

The automated browser did not load the unpacked extension, so installation
needs a manual Chrome check. Editing was not tested because the public card
was read-only.

Version 1.5 DOM fixture checks covered initials and image avatars, named and
color-only labels, cards without badges, and live badge text and color updates.
Desktop and 390 px layouts kept titles on one line with badges below, without
horizontal page overflow or browser errors. Live Trello markup still needs a
manual check after reloading the extension.

Version 1.5.1 uses Trello's live `compact-card-label` selector. Label text and
colors were checked on a public board. When the board hides badges, the open
card's tab reads its members and labels from the card details instead. A DOM
fixture verified that fallback, including initials and avatar colors.

Version 1.5.2 reads the colored inner avatar instead of its transparent wrapper.
A nested-avatar fixture verified white MK initials on a purple circle. Avatars
without a visible background use a neutral circle with readable initials.

Version 1.5.4 adds card numbers to the tab's second row and keeps the card
content below the sticky tabs so the title cannot paint over them. JavaScript
syntax, manifest JSON, and nine card URL parsing cases passed. Browser
validation was not run because no application start command is configured
in Libro.

Version 1.5.5 moves the card number to the right edge of the tab's second row.

Version 1.6.0 adds one-open-column board navigation. The local browser fixture
passed 22 checks covering tab switching, hidden cards, native drop hit testing,
empty-list drops, updated counts, keeping the source column open, replacing a
list DOM node and its classes, full-page card compatibility, drag cancellation,
and board cleanup. A real browser drag moved a card into an empty closed list without switching the open list. Desktop
(1,197 px) and mobile (390 px) screenshots were inspected. JavaScript syntax
and manifest JSON checks passed. These checks use simulated Trello markup;
live Trello saving and unpacked-extension installation still need a manual check.

To run the fixture without a server, open `tests/board-columns.html` in a browser
and run `runBoardColumnTests()` in its console. It uses fictional cards and makes
no changes to Trello.

Version 1.6.1 adds 12 px spacing after collapsed columns, including before the
open column, and removes collapsed-wrapper padding so tabs stay within their width.

Version 1.6.2 applies the same wrapper spacing to open and closed columns, fixing
uneven gaps on either side of the open column.

Version 1.6.3 centers the board row horizontally when it fits. Wider boards stay
aligned to the start so all columns remain reachable by scrolling.

Version 1.7.1 removes assigned-card counts, account discovery, and member scans.
Columns show only total card counts again. Centering, spacing, switching, and
native drag-and-drop stay available.

Version 1.8.0 allows up to two columns open at once. The first list opens by
default; opening a second keeps the first, and opening a third closes the oldest
open list. Native drops keep both selections. The local fixture passed 24 checks
at desktop and mobile widths, including replacing list nodes and closing dialogs.
