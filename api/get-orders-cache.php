<?php
/**
 * Retrieves orders and caches price for a specified item from the market API.
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

$item_slug = $_GET['item_slug'] ?? '';

$results = [];

header('Content-Type: application/json');

$orders = getCachedOrders($item_slug);

if ($orders === null) {
    $orders = fetchPriceFromAPI($item_slug);

    if ($orders !== null) {
        cacheOrders($item_slug, $orders);
    }

    $orders = getCachedOrders($item_slug);
}

$results[$item_slug] = [
    'name'   => $item_slug,
    'orders' => $orders['orders_json'], // from API or cache
    'last_checked' => $orders['last_checked'],
];

echo json_encode($results);
