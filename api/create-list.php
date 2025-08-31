<?php
/**
 * Creates a new shopping list and returns its ID as a JSON response.
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
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

$name = $data['name'] ?? '';
if ($name) {
    $pdo = getDb();
    $userId = $_SESSION['user_id'];
    $stmt = $pdo->prepare(
        "INSERT INTO shopping_lists (name, user_id) VALUES (?, ?)"
    );
    $stmt->execute([$name, $userId]);
    echo json_encode(['id' => $pdo->lastInsertId(), 'name' => $name]);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'List name is required']);
}
