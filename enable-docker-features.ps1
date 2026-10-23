# Script kich hoat cac tinh nang can thiet cho Docker Desktop tren Windows
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   DANG KICH HOAT CAC TINH NANG CHO DOCKER DESKTOP   " -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan

Write-Host "`n[1/2] Dang kich hoat Virtual Machine Platform..." -ForegroundColor Cyan
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

Write-Host "`n[2/2] Dang kich hoat Windows Subsystem for Linux (WSL)..." -ForegroundColor Cyan
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "                  HOAN TAT KICH HOAT!                " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host "Luu y quan trong: Ban can KHOI DONG LAI MAY TINH (Restart Windows)" -ForegroundColor Red
Write-Host "sau do mo lai Docker Desktop de het loi." -ForegroundColor Yellow
Write-Host "`nNhan phim bat ky de dong cua so nay..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
