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
4. **Environment configuration:**
   - Set the environment variable `WFM_API_BASE_URL` to configure the Warframe Market API endpoint (default: `https://api.warframe.market/v1`).
5. **Run the app:**
   - Open the app in your browser.

## API Endpoints

All endpoints are in `/api/` and return JSON. Endpoints are stateless and expect input via query parameters (GET) or JSON body (POST).


Example endpoints:

- `GET /api/get-items.php?search=...&category=...` — Search items
- `POST /api/add-to-list.php` — Add item to a list
- `POST /api/remove-from-list.php` — Remove item from a list
- `GET /api/get-orders-cache.php?item_slug=...` — Get cached price/orders for an item

-
API conventions:

- Input is validated and sanitized server-side for all endpoints.
- SQL queries use explicit column selection and sensible limits (single rows: LIMIT 1, lists: LIMIT 500).
- All persistent data is stored in SQLite; no session or file-based storage except for `last_update.txt`.

API conventions:
- Input is validated and sanitized server-side for all endpoints.
- SQL queries use explicit column selection and sensible limits (single rows: LIMIT 1, lists: LIMIT 500).
- All persistent data is stored in SQLite; no session or file-based storage except for `last_update.txt`.

## Development


### Coding Standards & Security

- PHP code style is enforced via `phpcs.xml` (PEAR ruleset, custom exclusions)
- Use 4 spaces for indentation, LF line endings, and no trailing whitespace
- All endpoints and helpers use consistent docblock format (author, license, link, etc.)
- Input validation and output sanitization are enforced to prevent XSS and SQL injection
- External links use `rel="noopener noreferrer"` for security
- Datetime display is refactored for timezone awareness

### Testing

- No formal test suite; manual testing via the web UI and API endpoints

## Contributions

Contributions are welcome! To contribute, create a fork of this repo and submit a pull request with your changes. Follow the existing coding style and ensure your changes are well-documented. Please document any new API endpoints and update the README as needed.

## License

Released under the [Unlicense](https://unlicense.org/)
