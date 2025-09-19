<?php
/**
 * User login endpoint
 *
 * PHP version: 8.0+
 *
 * @category API
 * @package  WFList
 * @author   Keith Solomon <keith@keithsolmon.net>
 * @license  Unlicense <https://unlicense.org>
 * @link     https://github.com/Solo-Web-Works/WF-Shop
 */

require_once __DIR__ . '/../database/db.php';

header('Content-Type: application/json');

$input    = json_decode(file_get_contents('php://input'), true);

// Sanitize and validate input
$username = isset($input['username']) ? trim(strip_tags($input['username'])) : '';
if ($username && strlen($username) > 32) {
    $username = substr($username, 0, 32);
}
if ($username && !preg_match('/^[\w\-]+$/', $username)) {
    $username = '';
}

$password = isset($input['password']) ? $input['password'] : '';
if ($password && strlen($password) > 128) {
    $password = substr($password, 0, 128);
}

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required.']);
    exit;
}

$pdo = getDb();

$stmt = $pdo->prepare(
    'SELECT id, password_hash
    FROM users
    WHERE username = ? LIMIT 1'
);
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid username or password.']);
    exit;
}

session_start();
$_SESSION['user_id']  = $user['id'];
$_SESSION['username'] = $username;

echo json_encode(
    [
        'success'  => true,
        'user_id'  => $user['id'],
        'username' => $username
    ]
);
