<?php
/**
 * Retrieves all shopping lists from the database
 * and returns them as a JSON response.
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

$pdo = getDb();

$userId = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT * FROM shopping_lists WHERE user_id = ?");
$stmt->execute([$userId]);

$lists = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($lists);
