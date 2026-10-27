<?php
/**
 * SI NAKHODA - Hostinger PHP Backend Bridge for System Configuration
 * Puskesmas Kepulauan Seribu Selatan
 * Menjamin konfigurasi Google Apps Script & Google Drive tersimpan secara permanen
 * di server Hostinger dan otomatis aktif untuk SELURUH pengguna & perangkat.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/../../data/system_config.json';
$altDataFile = __DIR__ . '/system_config.json';
$publicDataFile = __DIR__ . '/../system_config.json';

// Tentukan direktori penyimpanan
$targetDir = dirname($dataFile);
if (!is_dir($targetDir)) {
    @mkdir($targetDir, 0755, true);
}

// Konfigurasi bawaan
$defaultConfig = [
    'webhookUrl' => '',
    'spreadsheetUrl' => 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    'folderId' => '1HP3SLNCyaa6R7b4B7JC77Z9TzJPNMsF6',
    'folderUrl' => 'https://drive.google.com/drive/folders/1HP3SLNCyaa6R7b4B7JC77Z9TzJPNMsF6?usp=sharing',
    'whatsappApiKey' => '',
    'whatsappSender' => '081299887766',
    'autoResetHour' => '00:00',
    'updatedAt' => date('c'),
    'updatedBy' => 'Sistem'
];

// Helper membaca config dari file
function readConfigFile($paths, $default) {
    foreach ($paths as $path) {
        if (file_exists($path)) {
            $content = @file_get_contents($path);
            if ($content) {
                $decoded = json_decode($content, true);
                if (is_array($decoded)) {
                    return array_merge($default, $decoded);
                }
            }
        }
    }
    return $default;
}

// Helper menulis config ke file
function writeConfigFile($paths, $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    $saved = false;
    foreach ($paths as $path) {
        $dir = dirname($path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        if (@file_put_contents($path, $json)) {
            $saved = true;
        }
    }
    return $saved;
}

$searchPaths = [$dataFile, $altDataFile, $publicDataFile];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $config = readConfigFile($searchPaths, $defaultConfig);
    echo json_encode([
        'success' => true,
        'config' => $config,
        'source' => 'Hostinger LiteSpeed PHP Storage',
        'timestamp' => time()
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $payload = json_decode($input, true);

    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Format JSON tidak valid'
        ]);
        exit;
    }

    $current = readConfigFile($searchPaths, $defaultConfig);
    $updated = array_merge($current, $payload);
    $updated['updatedAt'] = date('c');

    $saved = writeConfigFile($searchPaths, $updated);

    echo json_encode([
        'success' => true,
        'message' => 'Konfigurasi GAS berhasil disimpan di server Hostinger & aktif di semua browser!',
        'savedToFile' => $saved,
        'config' => $updated
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);
