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
 * @license  Unlicense <https://unlicense.org>
 * @version  GIT: $Id$
 * @link     https://github.com/Solo-Web-Works/WF-Shop
 */

require_once __DIR__ . '/../database/db.php';

header('Content-Type: application/json');

$pdo = getDb();


// Sanitize and validate input
$search = isset($_GET['search']) ? trim(strip_tags($_GET['search'])) : '';
if ($search && strlen($search) > 64) {
    $search = substr($search, 0, 64);
}
if ($search && !preg_match('/^[\w\s\-\'\(\)]+$/u', $search)) {
    $search = '';
}

$category = isset($_GET['category']) ? trim(strip_tags($_GET['category'])) : '';
if ($category && strlen($category) > 32) {
    $category = substr($category, 0, 32);
}
if ($category && !preg_match('/^[\w\-]+$/u', $category)) {
    $category = '';
}


$sql = 'SELECT i.id, i.slug, i.name, GROUP_CONCAT(it.tag) as tags '
    . 'FROM items i '
    . 'LEFT JOIN item_tags it ON i.id = it.item_id';

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
