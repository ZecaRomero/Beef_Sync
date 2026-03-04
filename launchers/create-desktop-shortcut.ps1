param()
$projectDir = "c:\Users\zeca8\OneDrive\Documentos\Sistemas\beef sync"
$desktop = [Environment]::GetFolderPath('Desktop')
$wsh = New-Object -ComObject WScript.Shell

# Atalho principal (Desktop + Celular na WiFi)
$lnkPath = Join-Path $desktop "Beef Sync - Desktop e Celular.lnk"
$sc = $wsh.CreateShortcut($lnkPath)
$sc.TargetPath = Join-Path $projectDir "BEEF-SYNC-UNIFICADO.bat"
$sc.WorkingDirectory = $projectDir
$sc.IconLocation = "$projectDir\public\icon_local.ico"
$sc.Save()
Write-Host "Atalho criado: Beef Sync - Desktop e Celular" -ForegroundColor Green

# Atalho para acesso pela internet (celular em 4G/5G)
$lnkInternet = Join-Path $desktop "Beef Sync - Acesso Internet.lnk"
$sc2 = $wsh.CreateShortcut($lnkInternet)
$sc2.TargetPath = Join-Path $projectDir "BEEF-SYNC-INTERNET.bat"
$sc2.WorkingDirectory = $projectDir
$sc2.IconLocation = "$projectDir\public\icon_local.ico"
$sc2.Save()
Write-Host "Atalho criado: Beef Sync - Acesso Internet" -ForegroundColor Green
