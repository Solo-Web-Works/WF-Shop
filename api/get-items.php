<?php
/**
 * Retrieves items from the database based on search and category filters.
 * Returns them as a JSON response.
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

$pdo = getDb();

$search   = $_GET['search'] ?? '';
$category = $_GET['category'] ?? '';

$sql = 'SELECT i.id, i.slug, i.name, GROUP_CONCAT(it.tag) as tags ' .
    'FROM items i ' .
    'LEFT JOIN item_tags it ON i.id = it.item_id';

$params = array();

if ($search) {
    $sql     .= ' WHERE i.name LIKE ?';
    $params[] = '%' . $search . '%';
}

if ($category) {
    if ($search) {
        $sql .= ' AND';
    } else {
        $sql .= ' WHERE';
    }
    $sql     .= ' i.id IN (SELECT item_id FROM item_tags WHERE tag = ?)';
    $params[] = $category;
}

$sql .= ' GROUP BY i.id, i.slug, i.name';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($items);
