<?php
/**
 * Database connection for the Warframe Shopping List API.
 *
 * PHP version: 8.0+
 *
 * @category Database
 * @package  WFList
 * @author   Keith Solomon <keith@keithsolmon.net>
 * @license  Unlicense <https://unlicense.org>
 * @version  GIT: $Id$
 * @link     https://github.com/Solo-Web-Works/WF-Shop
 */

/**
 * Get a PDO database connection to the SQLite database.
 *
 * @return PDO The PDO instance connected to the SQLite database.
 */
function getDb() {
    $dbFile = __DIR__ . '/wf_market.db';

    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    return $pdo;
}
