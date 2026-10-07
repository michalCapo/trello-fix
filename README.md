# Trello Full Page Cards

Trello Full Page Cards is a Google Chrome extension. It makes Trello cards fill the whole browser tab, so they are easier to read and work with. It also keeps your boards tidy by showing at most two lists (columns) open at a time.

## Download

**[Download the latest version](https://github.com/michalCapo/trello-full-page-cards/releases/latest)**

On the download page, look under **Assets**. Download the file named **trello-full-page-cards-VERSION.zip**. VERSION is a number, for example `trello-full-page-cards-1.8.0.zip`.

Choose the named extension ZIP for the steps below, rather than the **Source code** downloads.

## Install in Google Chrome

You need Google Chrome on a desktop or laptop computer. You do not need to build anything.

1. Download the **trello-full-page-cards-VERSION.zip** file from the [download page](https://github.com/michalCapo/trello-full-page-cards/releases/latest).
2. Find the ZIP file in your Downloads folder.
3. Extract (unzip) it. On most computers, right-click the file and choose **Extract All** or **Extract Here**. On a Mac, double-click it.
4. Move the extracted folder to a place where it can stay, such as your Documents folder.
   - Chrome uses this folder every time it starts. Do not delete or move it after installing.
5. Open Chrome.
6. Type `chrome://extensions` in the address bar and press **Enter**.
7. Turn on **Developer mode**. The switch is in the top-right corner of the page.
8. Click **Load unpacked**. The button appears in the top-left after Developer mode is on.
9. Choose the correct folder:
   - Open the folder you extracted.
   - Inside it, find the folder named **extension**.
   - Select the **extension** folder and confirm.
   - Tip: The correct folder contains a file named **manifest.json**. If Chrome shows an error, you probably chose the wrong folder. Try again and choose **extension**.
10. The extension now appears in the list on the extensions page.
11. Go to any open Trello tabs and reload them.
12. Open a Trello card. It should now fill the whole tab.

## Update to a new version

1. Download the new **trello-full-page-cards-VERSION.zip** from the [download page](https://github.com/michalCapo/trello-full-page-cards/releases/latest).
2. Extract it.
3. Open the new **extension** folder. Copy all of its files.
4. Open the **extension** folder you installed the first time. Paste the files there. Choose to replace the old files.
5. Open `chrome://extensions` in Chrome.
6. Find **Trello Full Page Cards** and click its **Reload** button (the round arrow).
7. Reload your Trello tabs.

## Turn it off

To go back to Trello's normal layout:

1. Open `chrome://extensions`.
2. Turn off the switch on **Trello Full Page Cards**.
3. Reload Trello.

## What it does

### Full-page cards

- Cards fill the whole browser tab.
- On wide screens, comments appear on the right.
- On narrow screens, comments appear below the card.
- Long descriptions show in full. Nothing is cut off or faded.
- Images in descriptions show in full.
- Trello's own buttons, menus, editing, and close button still work. **Escape** still closes the card.

### Card strip

When a card is open, a strip of cards appears above it. The strip shows cards from the same list.

- Click a card in the strip to open it. The current card is highlighted.
- Each card shows member pictures, colored labels, and its card number (for example **#2496**).
- Drag a card in the strip to change its order in the list. Trello saves the new order. Press **Escape** to cancel a drag.
- Keyboard: select a card in the strip and press **Alt+Shift+Left** or **Alt+Shift+Right** to move it.
- Use the mouse wheel over the strip to scroll it sideways.

### Board columns

- At most two lists are open at once.
- The first list is open when the board loads.
- Closed lists appear as narrow tabs with their name and total number of cards.
- Click a closed list to open it.
- If two lists are already open, opening a third closes the one opened first.
- Drag a card onto a closed list to move it there. Your open lists stay open.
- The board is centered when it fits on the screen. When it is wider than the screen, scroll sideways to see all lists.

### Image previews

- Scroll the mouse wheel to zoom in and out.
- Click and drag to move around the image.
- Double-click, or press **0**, to fit the image to the screen again.
- **+** and **-** also zoom.

## Privacy

- No API key is needed.
- No extra account is needed.
- The extension never asks for your Trello password.
- It runs only on trello.com.
- It does not send your card data to any other service.
- It does not store your card data.

## Troubleshooting

- **Card counts look wrong, or the card strip is missing cards.** Clear any filters on the board. The extension only counts cards that Trello shows on the board.
- **The card strip is missing.** This can happen if you opened a card from a direct link and the board did not load. Open the card from its board instead.
- **Nothing changed after installing.** Reload your Trello tabs.

## For contributors

You only need this section if you want to build or publish a new version. You do not need it to install the extension.

**Requirements:** Make, Git, GitHub CLI (`gh`), and Python 3.

**Commands:**

- `make` lists all available actions.
- `make build` creates only the ZIP file: `dist/trello-full-page-cards-VERSION.zip`. It does not publish anything.
- `make release` or `./release` builds the ZIP, pushes `main` and the version tag, and publishes the ZIP on GitHub Releases.

**To publish a release:**

1. Set the new version in `extension/manifest.json`.
2. Commit all your changes on `main`. The command stops if there are uncommitted changes.
3. Sign in to GitHub CLI with `gh auth login`.
4. Run `make release`.

**Good to know:**

- Only the current GitHub release is kept. After the new ZIP uploads successfully, older releases and their files are deleted.
- Running the release again for the same commit uploads the ZIP again.
- To release a different commit, use a new version number in `extension/manifest.json`.
- If Trello changes its page layout, the extension may stop working. Update the selectors in `extension/content.js`, `extension/column-nav.js`, and `extension/board-columns.js`.
