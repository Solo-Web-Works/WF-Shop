<?php
/**
 * Retrieves items for a given shopping list as a JSON response.
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

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

header('Content-Type: application/json');

$list_id = $_GET['list_id'] ?? '';
if ($list_id) {
    $pdo = getDb();

    $userId = $_SESSION['user_id'];

    // Check that the list belongs to the user

    $check = $pdo->prepare(
        "SELECT id FROM shopping_lists
        WHERE id = ?
        AND user_id = ?
        LIMIT 1"
    );
    $check->execute([$list_id, $userId]);

    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Not authorized for this list']);
        exit;
    }

    $stmt = $pdo->prepare(
        "SELECT sli.id, i.name, i.slug
        FROM shopping_list_items sli
        JOIN items i ON sli.item_id = i.id
        WHERE sli.list_id = ?"
    );
    $stmt->execute(array($list_id));

    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($items as &$item) {
        // Fetch cached orders for each item
        $orders               = getCachedOrders($item['slug']);
        $item['price']        = $orders['orders_json'][0]['platinum'] ?? null;
        $item['last_checked'] = $orders['last_checked'] ?? null;
    }

    echo json_encode($items);
} else {
    http_response_code(400);
    echo json_encode(array('error' => 'List ID is required'));
}
