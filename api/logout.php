<?php
/**
 * User logout endpoint
 *
 * PHP version: 8.0+
 *
 * @category API
 * @package  WFList
 * @author   Keith Solomon <keith@keithsolmon.net>
 * @license  Unlicense <https://unlicense.org>
 * @link     https://github.com/Solo-Web-Works/WF-Shop
 */

header('Content-Type: application/json');
session_start();
session_destroy();
echo json_encode(['success' => true]);
