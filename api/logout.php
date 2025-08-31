<?php
/**
 * User logout endpoint
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
session_destroy();
echo json_encode(['success' => true]);
