<?php
/**
 * Retrieves orders for a specified item from the market API.
 *
 * PHP version: 8.0+
 *
 * @category API
 * @package  WFList
 * @author   Keith Solomon <keith@keithsolmon.net>
 * @license  MIT License
 * @version  GIT: $Id$
 * @link     https://git.keithsolomon.net/keith/Warframe_Shopping_List
 */

header('Content-Type: application/json');

$item_slug = $_GET['item_slug'] ?? '';

if ($item_slug) {
    // Simple rate limiting
    usleep(500000); // 2 requests per second

    $url = 'https://api.warframe.market/v2/orders/item/' . $item_slug;
    $json = file_get_contents($url);
    $data = json_decode($json, true);

    echo json_encode($data);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Item slug is required']);
}
