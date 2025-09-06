<?php
/**
 * Forces a refresh of orders for a specified item and updates the cache.
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

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json');

$item_slug = $_GET['item_slug'] ?? '';

if (!$item_slug) {
    http_response_code(400);
    echo json_encode(['error' => 'item_slug is required']);
    exit;
}

// Always fetch fresh from API, then cache and return current cached view
$orders = fetchPriceFromAPI($item_slug);

if ($orders !== null) {
    cacheOrders($item_slug, $orders);
}

// Read back from cache to include normalized structure and timestamp
$latest = getCachedOrders($item_slug);

if ($latest === null) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to refresh orders']);
    exit;
}

echo json_encode(
    [
    $item_slug => [
        'name'         => $item_slug,
        'orders'       => $latest['orders_json'],
        'last_checked' => $latest['last_checked'],
    ]
    ]
);

