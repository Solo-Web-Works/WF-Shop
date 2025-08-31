<?php
/**
 * Database setup script for Warframe Shopping List
 *
 * PHP version: 8.0+
 *
 * @category Database
 * @package  WFList
 * @author   Keith Solomon <keith@keithsolmon.net>
 * @license  MIT License
 * @version  GIT: $Id$
 * @link     https://git.keithsolomon.net/keith/Warframe_Shopping_List
 */

$dbFile = __DIR__ . '/wf_market.db';

if (!file_exists($dbFile)) {
    // Create the database file if it doesn't exist
    echo "Creating database file...\n";
    touch($dbFile);
}

$pdo = new PDO('sqlite:' . $dbFile);

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL,
        name TEXT NOT NULL
    );"
);

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS item_tags (
        item_id TEXT,
        tag TEXT,
        PRIMARY KEY (item_id, tag),
        FOREIGN KEY (item_id) REFERENCES items(id)
    );"
);

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS shopping_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        user_id INTEGER
    );"
);

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS shopping_list_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER,
        item_id TEXT,
        purchased INTEGER DEFAULT 0,
        FOREIGN KEY (list_id) REFERENCES shopping_lists(id),
        FOREIGN KEY (item_id) REFERENCES items(id)
    );"
);

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS prices (
        item_name TEXT PRIMARY KEY,
        orders_json TEXT,
        last_checked INTEGER
    )"
);

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
    )"
);

echo "Database setup complete.";
