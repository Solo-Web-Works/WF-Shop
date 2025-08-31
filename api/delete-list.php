<?php
/**
 * Delete a shopping list and all its items
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

require_once __DIR__ . '/../database/db.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$listId = isset($input['list_id']) ? intval($input['list_id']) : 0;

if (!$listId) {
    echo json_encode(['success' => false, 'error' => 'Missing list_id']);
    exit;
}

try {
    $db = getDb();

    // Delete items in the list
    $stmt = $db->prepare('DELETE FROM shopping_list_items WHERE list_id = ?');
    $stmt->execute([$listId]);

    // Delete the list itself
    $stmt = $db->prepare('DELETE FROM shopping_lists WHERE id = ?');
    $stmt->execute([$listId]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
