# Refactoring Migration Script

Write-Host ""
Write-Host "MODULAR ARCHITECTURE MIGRATION" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = "C:\source\number-line-duel"

function Safe-Copy {
    param($source, $dest)
    if (Test-Path $source) {
        Copy-Item $source $dest -Force
        Write-Host "  Copied: $(Split-Path $source -Leaf)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  Not found: $source" -ForegroundColor Yellow
        return $false
    }
}

Write-Host "Phase 1: Client Game Files..." -ForegroundColor Yellow
Safe-Copy "$baseDir\client\src\game.ts" "$baseDir\client\src\games\number-line\NumberLineGame.ts"
Safe-Copy "$baseDir\client\src\ui.ts" "$baseDir\client\src\games\number-line\NumberLineUI.ts"
Safe-Copy "$baseDir\client\src\goose-game.ts" "$baseDir\client\src\games\goose-duel\GooseDuelGame.ts"
Safe-Copy "$baseDir\client\src\goose-ui.ts" "$baseDir\client\src\games\goose-duel\GooseDuelUI.ts"

Write-Host ""
Write-Host "Phase 2: Server Game Files..." -ForegroundColor Yellow
Safe-Copy "$baseDir\server\src\Game.ts" "$baseDir\server\src\games\number-line\NumberLineGame.ts"
Safe-Copy "$baseDir\server\src\Player.ts" "$baseDir\server\src\games\number-line\Player.ts"
Safe-Copy "$baseDir\server\src\GooseGame.ts" "$baseDir\server\src\games\goose-duel\GooseGame.ts"
Safe-Copy "$baseDir\server\src\Card.ts" "$baseDir\server\src\games\goose-duel\Card.ts"

Write-Host ""
Write-Host "Phase 3: Core Files..." -ForegroundColor Yellow
Safe-Copy "$baseDir\client\src\client.ts" "$baseDir\client\src\core\App.ts"
Safe-Copy "$baseDir\server\src\Server.ts" "$baseDir\server\src\core\Server.ts"

Write-Host ""
Write-Host "Phase 4: Types..." -ForegroundColor Yellow
Safe-Copy "$baseDir\shared\types.ts" "$baseDir\shared\types\common.ts"
Safe-Copy "$baseDir\shared\goose-types.ts" "$baseDir\shared\types\goose-duel.ts"

Write-Host ""
Write-Host "Done! Files copied successfully." -ForegroundColor Green
Write-Host ""
