# PowerShell script to download Noto Sans Telugu font
$fontUrl = "https://github.com/google/fonts/raw/main/ofl/notosanstelugu/NotoSansTelugu-Regular.ttf"
$fontPath = "NotoSansTelugu-Regular.ttf"

Write-Host "Downloading Noto Sans Telugu font..."
try {
    Invoke-WebRequest -Uri $fontUrl -OutFile $fontPath -UseBasicParsing
    Write-Host "✅ Font downloaded successfully: $fontPath"
} catch {
    Write-Host "❌ Failed to download font: $_"
    Write-Host ""
    Write-Host "Please download manually from:"
    Write-Host "https://fonts.google.com/noto/specimen/Noto+Sans+Telugu"
    Write-Host ""
    Write-Host "Or use this direct link:"
    Write-Host $fontUrl
    Write-Host ""
    Write-Host "Save the file as: NotoSansTelugu-Regular.ttf in the fonts folder"
}

