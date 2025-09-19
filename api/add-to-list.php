<?php
/**
 * Add items for to the active shopping list.
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

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);



// Sanitize and validate input
$list_id = (
    isset($data['list_id']) &&
    ctype_digit(strval($data['list_id'])) &&
    intval($data['list_id']) > 0
) ? intval($data['list_id']) : 0;
$item_id = isset($data['item_id']) ? trim(strip_tags($data['item_id'])) : '';
if ($item_id && strlen($item_id) > 32) {
    $item_id = substr($item_id, 0, 32);
}
if ($item_id && !preg_match('/^[a-zA-Z0-9_-]+$/', $item_id)) {
    $item_id = '';
}

if ($list_id && $item_id) {
    $pdo = getDb();

    // Check that the list belongs to the logged-in user
    $userId = $_SESSION['user_id'];

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
        "INSERT INTO shopping_list_items (
            list_id,
            item_id
        )
        VALUES (?, ?)"
    );

    $stmt->execute([$list_id, $item_id]);

    echo json_encode(
        [
            'id' => $pdo->lastInsertId(),
            'list_id' => $list_id,
            'item_id' => $item_id,
            'purchased' => 0
        ]
    );
} else {
    http_response_code(400);
    echo json_encode(['error' => 'List ID and Item ID are required']);
}
