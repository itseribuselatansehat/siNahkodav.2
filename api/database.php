<?php
/**
 * SI NAKHODA - Hostinger PHP Backend Bridge for Real-time Database
 * Puskesmas Kecamatan Kepulauan Seribu Selatan
 * Menyinkronkan status presensi, check-in, dan lapor diri secara realtime (3 Detik)
 * antar seluruh perangkat & browser di Hostinger.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbFile = __DIR__ . '/../../data/app_database.json';
$altDbFile = __DIR__ . '/app_database.json';

// Pastikan direktori ada
$targetDir = dirname($dbFile);
if (!is_dir($targetDir)) {
    @mkdir($targetDir, 0755, true);
}

$defaultDb = [
    'lastUpdated' => time() * 1000,
    'pegawai' => [],
    'movementLogs' => [],
    'laporDiriList' => []
];

function readDbFile($paths, $default) {
    foreach ($paths as $path) {
        if (file_exists($path)) {
            $raw = @file_get_contents($path);
            if ($raw) {
                $decoded = json_decode($raw, true);
                if (is_array($decoded) && isset($decoded['pegawai'])) {
                    return $decoded;
                }
            }
        }
    }
    return $default;
}

function writeDbFile($paths, $data) {
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

$paths = [$dbFile, $altDbFile];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $db = readDbFile($paths, $defaultDb);
    echo json_encode([
        'success' => true,
        'timestamp' => time() * 1000,
        'lastUpdated' => isset($db['lastUpdated']) ? $db['lastUpdated'] : (time() * 1000),
        'data' => $db
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $body = json_decode($input, true);

    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Format JSON tidak valid']);
        exit;
    }

    $currentDb = readDbFile($paths, $defaultDb);
    $action = isset($body['action']) ? $body['action'] : '';
    $payload = isset($body['payload']) ? $body['payload'] : null;

    if ($action === 'checkin' && is_array($payload)) {
        $pegawaiId = isset($payload['pegawaiId']) ? $payload['pegawaiId'] : '';
        $tempatKerja = isset($payload['tempatKerja']) ? $payload['tempatKerja'] : '';
        $lantai = isset($payload['lantai']) ? $payload['lantai'] : 'Lantai 1';
        $unitId = isset($payload['unitId']) ? $payload['unitId'] : '';
        $unitName = isset($payload['unitName']) ? $payload['unitName'] : '';
        $kondisi = isset($payload['kondisi']) ? $payload['kondisi'] : 'siap_melayani';
        $catatan = isset($payload['catatan']) ? $payload['catatan'] : '';
        $lastCheckinTime = isset($payload['lastCheckinTime']) ? $payload['lastCheckinTime'] : date('H:i');
        $selfieUrl = isset($payload['selfieUrl']) ? $payload['selfieUrl'] : null;
        $coordinates = isset($payload['coordinates']) ? $payload['coordinates'] : null;

        // Update pegawai status & current room
        $found = false;
        if (isset($currentDb['pegawai']) && is_array($currentDb['pegawai'])) {
            foreach ($currentDb['pegawai'] as &$p) {
                $pId = isset($p['id']) ? $p['id'] : '';
                $pNip = isset($p['nip']) ? $p['nip'] : '';
                $logNip = (isset($payload['movementLog']) && isset($payload['movementLog']['nip'])) ? $payload['movementLog']['nip'] : '';
                if ($pId === $pegawaiId || $pNip === $pegawaiId || ($logNip && $pNip === $logNip)) {
                    $p['status'] = 'hadir';
                    $p['currentTempatKerja'] = $tempatKerja;
                    $p['currentLantai'] = $lantai;
                    $p['currentUnitId'] = $unitId;
                    $p['currentUnitName'] = $unitName;
                    $p['kondisi'] = $kondisi;
                    $p['kondisiCatatan'] = $catatan;
                    $p['lastCheckinTime'] = $lastCheckinTime;
                    $p['lastUpdateTime'] = $lastCheckinTime;
                    if ($selfieUrl) $p['selfieUrl'] = $selfieUrl;
                    if ($coordinates) $p['coordinates'] = $coordinates;
                    $found = true;
                    break;
                }
            }
            unset($p);
        }

        // If employee not in database yet, create them so they appear in dashboard room immediately!
        if (!$found) {
            $ml = isset($payload['movementLog']) ? $payload['movementLog'] : [];
            $newP = [
                'id' => $pegawaiId ? $pegawaiId : ('peg-' . time()),
                'nip' => isset($ml['nip']) ? $ml['nip'] : $pegawaiId,
                'nama' => isset($ml['pegawaiNama']) ? $ml['pegawaiNama'] : 'Pegawai',
                'profesi' => 'Tenaga Kesehatan',
                'jabatan' => 'Staf Pelayanan',
                'tempatTugas' => $tempatKerja,
                'role' => 'pegawai',
                'telepon' => '',
                'avatar' => 'https://images.unsplash.com/photo-1534528741775?w=150&auto=format&fit=crop&q=80',
                'status' => 'hadir',
                'kondisi' => $kondisi,
                'kondisiCatatan' => $catatan,
                'currentTempatKerja' => $tempatKerja,
                'currentLantai' => $lantai,
                'currentUnitId' => $unitId,
                'currentUnitName' => $unitName,
                'lastCheckinTime' => $lastCheckinTime,
                'lastUpdateTime' => $lastCheckinTime,
                'selfieUrl' => $selfieUrl,
                'coordinates' => $coordinates
            ];
            $currentDb['pegawai'][] = $newP;
        }

        // Prepend movement log
        if (isset($payload['movementLog']) && is_array($payload['movementLog'])) {
            array_unshift($currentDb['movementLogs'], $payload['movementLog']);
            if (count($currentDb['movementLogs']) > 150) {
                $currentDb['movementLogs'] = array_slice($currentDb['movementLogs'], 0, 150);
            }
        }
    } elseif ($action === 'lapordiri' && is_array($payload)) {
        array_unshift($currentDb['laporDiriList'], $payload);
        if (count($currentDb['laporDiriList']) > 150) {
            $currentDb['laporDiriList'] = array_slice($currentDb['laporDiriList'], 0, 150);
        }
    } elseif (isset($body['pegawai']) && is_array($body['pegawai'])) {
        $currentDb = array_merge($currentDb, $body);
    }

    $currentDb['lastUpdated'] = time() * 1000;
    writeDbFile($paths, $currentDb);

    echo json_encode([
        'success' => true,
        'message' => 'Database berhasil diperbarui dan disinkronkan',
        'lastUpdated' => $currentDb['lastUpdated'],
        'data' => $currentDb
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);
