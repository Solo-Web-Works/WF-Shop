<?php
/**
 * Updates the items list from the Warframe Market API if more than
 * 24 hours have passed since the last update.
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

require_once __DIR__ . '/db.php';

/**
 * Updates the items list.
 *
 * @return void
 */
function updateItems() {
    // if the file doesn't exist, set last_update to 0 and create the file
    if (! file_exists('./last_update.txt')) {
        $last_update = 0;
        file_put_contents('./last_update.txt', $last_update);
    } else {
        $last_update = file_get_contents('./last_update.txt');
    }

    if (time() - $last_update > 24 * 60 * 60) {
        $baseUrl = getenv('WFM_API_BASE_URL') ?: 'https://api.warframe.market/v2';
        $url  = $baseUrl . '/items';
        $json = file_get_contents($url);
        $data = json_decode($json, true);

        $pdo = getDb();

        try {
            $pdo->beginTransaction();

            $stmt_item = $pdo->prepare(
                'INSERT OR REPLACE INTO items (id, slug, name)
                VALUES (?, ?, ?)'
            );
            $stmt_tag  = $pdo->prepare(
                'INSERT OR IGNORE INTO item_tags (item_id, tag)
                VALUES (?, ?)'
            );

            foreach ($data['data'] as $item) {
                $stmt_item->execute(
                    array($item['id'], $item['slug'], $item['i18n']['en']['name'])
                );

                foreach ($item['tags'] as $tag) {
                    $stmt_tag->execute(array($item['id'], $tag));
                }
            }

            $pdo->commit();

            file_put_contents('./last_update.txt', time());

            echo 'Item list updated successfully.';
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log('Update items failed: ' . $e->getMessage());
            echo 'Item list update failed.';
        }
    } else {
        echo 'Item list is up to date.';
    }
}
