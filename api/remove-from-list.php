<?php
/**
 * Remove an item from the active shopping list.
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

$id = $data['id'] ?? '';

if ($id) {
    $pdo = getDb();

    $userId = $_SESSION['user_id'];

    // Check that the item belongs to a list owned by the user
    $check = $pdo->prepare(
        "SELECT sli.id FROM shopping_list_items sli
        JOIN shopping_lists sl
        ON sli.list_id = sl.id
        WHERE sli.id = ?
        AND sl.user_id = ?"
    );
    $check->execute([$id, $userId]);

    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Not authorized for this item']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM shopping_list_items WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Item ID is required']);
}
