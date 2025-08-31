<?php
/**
 * Session check endpoint
 *
 * PHP version: 8.0+
 *
 * @category API
 * @package  WFList
 * @author   Keith Solomon <keith@keithsolmon.net>
 * @license  MIT License
 * @link     https://git.keithsolomon.net/keith/Warframe_Shopping_List
 */

header('Content-Type: application/json');

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['logged_in' => false]);
    exit;
}

echo json_encode(
    [
        'logged_in' => true,
        'user_id'   => $_SESSION['user_id'],
        'username'  => $_SESSION['username'] ?? null
    ]
);
