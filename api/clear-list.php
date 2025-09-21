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

require_once __DIR__ . '/../database/db.php';

session_start();

if ( ! isset( $_SESSION['user_id'] ) ) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

header('Content-Type: application/json');

$pdo = getDb();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $listId = $data['list_id'] ?? null;

    if ($listId) {
        $userId = $_SESSION['user_id'];

        // Check that the list belongs to the user
        $check = $pdo->prepare(
            "SELECT id FROM shopping_lists
            WHERE id = ?
            AND user_id = ?"
        );
        $check->execute([$listId, $userId]);

        if (!$check->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Not authorized for this list']);
            exit;
        }

        // Limit to 500 items per clear operation
        $stmt = $pdo->prepare(
            "DELETE FROM shopping_list_items
            WHERE list_id = ?"
        );
        $stmt->execute([$listId]);

        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid list ID']);
    }
}
