<?php
/**
 * Helper functions for the WFList API.
 *
 * PHP version: 8.0+
 *
 * @category API
 * @package  WFList
 * @author   Keith Solomon <keith@keithsolmon.net>
 * @license  Unlicense <https://unlicense.org>
 * @version  GIT: $Id$
 * @link     https://github.com/Solo-Web-Works/WF-Shop
 */

require_once __DIR__ . '/../database/db.php';

/**
 * Retrieves the cached price for a given item from the database
 * if it was checked within the last 30 minutes.
 *
 * @param string $itemName The name of the item to look up.
 *
 * @return int|null The cached price if available and recent, or null otherwise.
 */
function getCachedOrders(string $itemName): ?array {
    $db = getDb();

    $stmt = $db->prepare(
        "SELECT orders_json, last_checked FROM prices
        WHERE item_name = :name"
    );
    $stmt->execute([':name' => $itemName]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // if ($result) {
    if ($result && (time() - $result['last_checked']) < 1800) {
        $orders['orders_json'] = json_decode($result['orders_json'], true);

        if (is_array($orders['orders_json'])) {
            usort(
                $orders['orders_json'],
                function ($a, $b) {
                    return $a['platinum'] <=> $b['platinum'];
                }
            );
        }

        $orders['last_checked'] = $result['last_checked'];

        return $orders;
    }

    return null;
}

/**
 * Fetches the lowest platinum price for an item from the Warframe Market API,
 * considering only orders from users currently ingame.
 *
 * @param string $itemName The name of the item to fetch the price for.
 *
 * @return int|null The lowest platinum price found, or null if unavailable.
 */
function fetchPriceFromAPI(string $itemName): ?array {
    $encodedName = urlencode(strtolower(str_replace(' ', '_', $itemName)));
    $baseUrl = getenv('WFM_API_BASE_URL') ?: 'https://api.warframe.market/v2';
    $url = $baseUrl . '/orders/item/' . $encodedName . '/top';

    // Simple rate limiting
    usleep(500000); // 2 requests per second

    $response = @file_get_contents($url);
    if ($response === false) {
        return null;
    }

    $data = json_decode($response, true);

    if (!isset($data['data']['sell']) || !is_array($data['data']['sell'])) {
        return null;
    }

    return $data['data']['sell'] ?? null;
}

/**
 * Caches the price for a given item in the database, updating if it already exists.
 *
 * @param string $itemName The name of the item to cache.
 * @param array  $orders   The orders to cache.
 *
 * @return void
 */
function cacheOrders(string $itemName, array $orders): void {
    $db = getDb();

    $stmt = $db->prepare(
        "INSERT INTO prices (item_name, orders_json, last_checked)
        VALUES (:name, :orders, :checked)
        ON CONFLICT(item_name) DO UPDATE SET
        orders_json = excluded.orders_json,
        last_checked = excluded.last_checked"
    );

    $stmt->execute(
        [
            ':name' => $itemName,
            ':orders' => json_encode($orders),
            ':checked' => time()
        ]
    );
}

/**
 * Logs a variable to the browser's console for debugging purposes.
 *
 * @param string $msg The message to log.
 * @param mixed  $var The variable to log.
 *
 * @return void
 */
function consoleLog($msg, $var) {
    echo '<script>console.log('.$msg.': '.json_encode($var).');</script>';
}
