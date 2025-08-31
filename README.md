# Warframe Shopping List

Manage shopping lists of Warframe items, with real-time price checks from the Warframe Market API.

## Features

- Create and manage multiple shopping lists for Warframe items
- Real-time price checking and caching from the Warframe Market API
- Item catalog with search and category filtering
- Persistent data storage using SQLite
- Responsive JavaScript frontend with dark mode
- Support for multiple users, allowing each user to have their own shopping lists

## Project Structure

- `index.html` — Main frontend UI
- `js/app.js` — Frontend logic and API calls
- `css/style.css` — Stylesheet
- `api/` — PHP API endpoints (REST-like)
- `database/` — SQLite database, schema, and access helpers
- `src/update_items.php` — Script to update item data from Warframe Market
- `update.php` — Wrapper to run item updates

## Setup

1. **Dependencies:**
   - Web server with PHP support (Apache, Nginx, or built-in PHP server)
   - PHP 8.0 or higher
   - SQLite3
2. **Database setup:**
   - Run `php database/setup.php` to initialize the database schema.
3. **Update item data:**
   - Run `php update.php` from the `database` directory to fetch the latest item list from the Warframe Market API.
     - _Optional_: Set up a cron job to run this script daily.
4. **Run the app:**
   - Open the app in your browser.

## API Endpoints

- All endpoints are in `/api/` and return JSON.
- Example endpoints:
  - `GET /api/get-items.php?search=...&category=...` — Search items
  - `POST /api/add-to-list.php` — Add item to a list
  - `POST /api/remove-from-list.php` — Remove item from a list
  - `GET /api/get-orders-cache.php?item_slug=...` — Get cached price/orders for an item

## Development

- PHP code style is enforced via `phpcs.xml` (PEAR ruleset)
- No formal test suite; manual testing via the web UI and API endpoints
- All persistent data is stored in SQLite; no session or file-based storage except for `last_update.txt`

## Contributions

Contributions are welcome! To contribute, create a fork of this repo and submit a pull request with your changes.  Follow the existing coding style and ensure your changes are well-documented.

## License

Released under the [Unlicense](https://unlicense.org/)
