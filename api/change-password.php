<?php
/**
 * Change Password API endpoint
 *
 * PHP version: 8.0+
 *
 * Allows a logged-in user to change their password.
 *
 * @category API
 * @package  WFList
 * @author   Keith Solomon <keith@keithsolmon.net>
 * @license  Unlicense <https://unlicense.org>
 * @link     https://github.com/Solo-Web-Works/WF-Shop
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../database/db.php';

header('Content-Type: application/json');

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['currentPassword'], $data['newPassword'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters.']);
    exit;
}

$userId          = $_SESSION['user_id'];
$currentPassword = $data['currentPassword'];
$newPassword     = $data['newPassword'];

$db = getDb();

$stmt = $db->prepare('SELECT password_hash FROM users WHERE id = :id');
$stmt->execute([':id' => $userId]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Current password is incorrect.']);
    exit;
}

$newHash = password_hash($newPassword, PASSWORD_DEFAULT);
$update  = $db->prepare('UPDATE users SET password_hash = :password WHERE id = :id');

$update->execute([':password' => $newHash, ':id' => $userId]);

echo json_encode(['success' => true]);
