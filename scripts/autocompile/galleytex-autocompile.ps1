# GalleyTeX · Windows 本机编译。仅编译自己导出或来源可信的 ZIP。
# 用法：
#   1) 双击 GalleyTeX-autocompile.bat，选择要监视的目录并逐个确认 ZIP；
#   2) 将自己导出或来源可信的项目 ZIP 拖到 .bat 上，直接编译这个项目；
#   3) 将文件夹拖到 .bat 上，监视该目录并逐个确认 ZIP。
# 需要本机已安装 TeX Live 或 MiKTeX（需要 xelatex；有 latexmk 更好，没有也可以）。
param([string]$Target = "")

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "GalleyTeX 自动编译（XeLaTeX）"

function Find-TexBinary([string]$name) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @(
        ("C:\texlive\*\bin\windows\" + $name + ".exe"),
        ("C:\texlive\*\bin\win64\" + $name + ".exe"),
        ("C:\texlive\*\bin\win32\" + $name + ".exe"),
        (Join-Path $env:LOCALAPPDATA ("Programs\MiKTeX\miktex\bin\x64\" + $name + ".exe")),
        ("C:\Program Files\MiKTeX\miktex\bin\x64\" + $name + ".exe"),
        ("C:\Program Files (x86)\MiKTeX\miktex\bin\" + $name + ".exe")
    )
    foreach ($c in $candidates) {
        $hit = Get-Item -Path $c -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
        if ($hit) { return $hit.FullName }
    }
    return $null
}

# The exported project is written for XeLaTeX (Unicode text, xeCJK for Chinese, fontspec). Prefer latexmk -xelatex,
# then plain xelatex (3 passes); pdflatex is only a last resort and will fail on Chinese characters.
function Find-Engine {
    $lm = Find-TexBinary "latexmk"; $xe = Find-TexBinary "xelatex"; $pdf = Find-TexBinary "pdflatex"
    if ($lm -and $xe) { return @{ Kind = "latexmk"; Path = $lm } }
    if ($xe) { return @{ Kind = "xelatex"; Path = $xe } }
    if ($pdf) { return @{ Kind = "pdflatex"; Path = $pdf } }
    return $null
}

# 等待浏览器把 ZIP 写完（大小稳定且文件不再被占用）
function Wait-ForStable([string]$path) {
    $last = -1
    for ($i = 0; $i -lt 40; $i++) {
        try { $len = (Get-Item -LiteralPath $path -ErrorAction Stop).Length } catch { return $false }
        if ($len -gt 0 -and $len -eq $last) {
            try {
                $fs = [System.IO.File]::Open($path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::None)
                $fs.Close()
                return $true
            } catch { }
        }
        $last = $len
        Start-Sleep -Milliseconds 700
    }
    return $false
}

function Invoke-Compile([string]$zipPath) {
    Write-Host ""
    Write-Host ("==> 发现 " + $zipPath) -ForegroundColor Cyan
    $zipName = [System.IO.Path]::GetFileNameWithoutExtension($zipPath)
    $paperName = ($zipName -replace '-LaTeX-Project.*$', '')
    if (-not $paperName) { $paperName = $zipName }
    $ascii = ($zipName -replace '[^A-Za-z0-9_-]', '_').Trim('_')
    if (-not $ascii) { $ascii = "paper" }
    # 每次使用新的工程目录，避免把上一轮的日志和 PDF 当作本次输出。
    $buildRoot = Join-Path ([System.IO.Path]::GetTempPath()) "galleytex-build"
    $dir = Join-Path $buildRoot ($ascii + "-" + [Guid]::NewGuid().ToString("N"))
    try {
        New-Item -ItemType Directory -Force -Path $dir -ErrorAction Stop | Out-Null
        Expand-Archive -LiteralPath $zipPath -DestinationPath $dir -ErrorAction Stop
    } catch {
        Write-Host ("    解压失败：" + $_.Exception.Message) -ForegroundColor Red
        return $false
    }
    if (-not (Test-Path (Join-Path $dir "main.tex"))) {
        Write-Host "    ZIP 里没有 main.tex，跳过。" -ForegroundColor Yellow
        return $false
    }
    $layout = "未知版式"
    $head = Get-Content (Join-Path $dir "main.tex") -TotalCount 6 -Encoding UTF8
    if ($head -match '^\\documentclass\[sigconf') { $layout = "双栏定稿版 sigconf" }
    elseif ($head -match '^\\documentclass\[acmsmall') { $layout = "单栏定稿版 acmsmall" }
    elseif ($head -match '^\\documentclass\[manuscript') { $layout = "单栏校对版 manuscript" }
    Write-Host ("    版式：" + $layout)

    Push-Location $dir
    $ok = $false
    $pages = ""
    try {
        $pass = 0
        $again = $true
        $maxPass = if ($script:Engine.Kind -eq "latexmk") { 1 } else { 3 }
        while ($again -and $pass -lt $maxPass) {
            $pass++
            if ($script:Engine.Kind -eq "latexmk") {
                Write-Host "    latexmk -xelatex …"
                $buildOutput = & $script:Engine.Path -norc -xelatex -no-shell-escape -halt-on-error -interaction=nonstopmode -file-line-error main.tex 2>&1
            } else {
                Write-Host ("    " + $script:Engine.Kind + " 第 " + $pass + " 遍…")
                $buildOutput = & $script:Engine.Path -no-shell-escape -halt-on-error -interaction=nonstopmode -file-line-error main.tex 2>&1
            }
            $code = $LASTEXITCODE
            $log = ""
            if (Test-Path "main.log") { $log = [System.IO.File]::ReadAllText((Join-Path $dir "main.log")) }
            if ($code -ne 0 -or $log -match '(?m)^!' -or -not (Test-Path "main.pdf") -or (Get-Item "main.pdf").Length -eq 0) {
                Write-Host "    编译出错：" -ForegroundColor Red
                $errs = ($log -split "`r?`n") | Where-Object { $_ -match '^(!|main\.tex:\d+:)' } | Select-Object -First 8
                foreach ($e in $errs) { Write-Host ("      " + $e) -ForegroundColor Red }
                if ($script:Engine.Kind -eq "pdflatex" -and $log -match 'Unicode character') {
                    Write-Host "    提示：项目需要 XeLaTeX（中文或 Unicode 符号）。请在 TeX Live/MiKTeX 中安装 xelatex 后重试。" -ForegroundColor Yellow
                }
                $logCopy = Join-Path (Split-Path -Parent $zipPath) ($paperName + "-编译日志.log")
                if ($log) { Copy-Item "main.log" $logCopy -Force }
                else { $buildOutput | Set-Content -LiteralPath $logCopy -Encoding UTF8 }
                Write-Host ("    完整日志：" + $logCopy)
                [Console]::Beep(800, 300)
                return $false
            }
            $again = ($log -match 'Rerun to get|Label\(s\) may have changed|There were undefined references')
            if ($log -match 'Output written on main\.(pdf|xdv) \((\d+) pages?') { $pages = $Matches[1] }
        }
        $ok = $true
    } finally {
        Pop-Location
    }
    if ($ok) {
        $pdfOut = Join-Path (Split-Path -Parent $zipPath) ($paperName + "-" + ($layout -replace '\s.*$', '') + ".pdf")
        Copy-Item -LiteralPath (Join-Path $dir "main.pdf") -Destination $pdfOut -Force -ErrorAction Stop
        Write-Host ("    完成：" + $pages + " 页 → " + $pdfOut) -ForegroundColor Green
        Write-Host ("    工程目录：" + $dir)
        Start-Process $pdfOut
    }
    return $ok
}

# ---------------------------------------------------------------------------
$script:Engine = Find-Engine
if (-not $script:Engine) {
    Write-Host "没有找到 xelatex/pdflatex。请先安装 TeX Live（https://tug.org/texlive/）或 MiKTeX（https://miktex.org/），装好后重新运行。" -ForegroundColor Red
    Read-Host "按回车键关闭"
    exit 1
}
Write-Host ("使用 " + $script:Engine.Kind + "：" + $script:Engine.Path)
if ($script:Engine.Kind -eq "pdflatex") { Write-Host "警告：只找到 pdflatex。含中文或 Unicode 符号的稿件会编译失败，建议安装 xelatex。" -ForegroundColor Yellow }

if ($Target -and (Test-Path -LiteralPath $Target) -and $Target -match '\.zip$') {
    if (Invoke-Compile (Resolve-Path -LiteralPath $Target).Path) { exit 0 }
    exit 1
}

# ---- 选择要监视的文件夹：上次的选择保存在脚本旁边的 galleytex-autocompile.cfg 里 ----
$cfgPath = Join-Path $PSScriptRoot "galleytex-autocompile.cfg"
function Read-SavedDir {
    try { if (Test-Path -LiteralPath $cfgPath) { $v = (Get-Content -LiteralPath $cfgPath -Encoding UTF8 -TotalCount 1); if ($v) { return $v.Trim() } } } catch { }
    return ""
}
function Save-Dir([string]$dir) {
    try { [System.IO.File]::WriteAllText($cfgPath, $dir, (New-Object System.Text.UTF8Encoding $true)) } catch { }
}
function Select-DirDialog([string]$start) {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
        $dlg.Description = "选择浏览器保存 LaTeX 项目 ZIP 的文件夹（编译好的 PDF 也放这里）"
        $dlg.ShowNewFolderButton = $true
        if ($start -and (Test-Path -LiteralPath $start)) { $dlg.SelectedPath = $start }
        $owner = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true; ShowInTaskbar = $false }
        if ($dlg.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK) { return $dlg.SelectedPath }
    } catch { Write-Host "无法打开文件夹选择框，请直接输入路径。" -ForegroundColor Yellow }
    return ""
}

$watchDir = ""
if ($Target -and (Test-Path -LiteralPath $Target -PathType Container)) {
    $watchDir = (Resolve-Path -LiteralPath $Target).Path
} else {
    $watchDir = Read-SavedDir
    while ($true) {
        Write-Host ""
        Write-Host ("监视目录：" + $watchDir) -ForegroundColor Cyan
        Write-Host "  输入目录路径，或输入 s 打开文件夹选择框。已有监视目录时可回车确认。"
        $ans = ([string](Read-Host "请选择")).Trim().Trim('"')
        if (-not $ans) {
            if ($watchDir -and (Test-Path -LiteralPath $watchDir -PathType Container)) { break }
            continue
        }
        if ($ans -eq "s" -or $ans -eq "S") {
            $picked = Select-DirDialog $watchDir
            if ($picked) { $watchDir = $picked }
            continue
        }
        if (Test-Path -LiteralPath $ans -PathType Container) { $watchDir = (Resolve-Path -LiteralPath $ans).Path; continue }
        Write-Host ("目录不存在：" + $ans) -ForegroundColor Red
    }
}
if (-not (Test-Path -LiteralPath $watchDir)) {
    Write-Host ("监视目录不存在：" + $watchDir) -ForegroundColor Red
    Read-Host "按回车键关闭"
    exit 1
}
Save-Dir $watchDir
$Host.UI.RawUI.WindowTitle = "GalleyTeX 自动编译 · 监视 " + $watchDir

$seen = @{}
Get-ChildItem -LiteralPath $watchDir -Filter "*-LaTeX-Project*.zip" -File -ErrorAction SilentlyContinue | ForEach-Object { $seen[$_.FullName] = $_.LastWriteTimeUtc.Ticks }
Write-Host ("正在监视 " + $watchDir)
Write-Host "检测到项目 ZIP 后，请逐个确认来源。按 Ctrl+C 退出。"

while ($true) {
    Start-Sleep -Seconds 2
    $files = Get-ChildItem -LiteralPath $watchDir -Filter "*-LaTeX-Project*.zip" -File -ErrorAction SilentlyContinue
    foreach ($f in $files) {
        $key = $f.FullName
        if ($seen.ContainsKey($key) -and $seen[$key] -eq $f.LastWriteTimeUtc.Ticks) { continue }
        if (-not (Wait-ForStable $key)) { continue }
        $seen[$key] = (Get-Item -LiteralPath $key).LastWriteTimeUtc.Ticks
        $answer = Read-Host ("编译这个可信 ZIP？[y/N] " + $key)
        if ($answer -eq "y") { $null = Invoke-Compile $key }
        Write-Host ""
        Write-Host "继续监视中…（Ctrl+C 退出）"
    }
}
