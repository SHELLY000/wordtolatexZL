# GalleyTeX · Windows 本机自动编译脚本（监视下载目录，ZIP 落地即用 XeLaTeX 编译并打开 PDF）
# 用法：
#   1) 双击 EI自动编译.bat —— 启动时确认/输入要监视的文件夹（记住上次的选择），之后工具每导出一个
#      *-LaTeX-Project.zip 到该文件夹，就自动解压、pdfLaTeX 编译并打开 PDF；
#   2) 把某个 *-LaTeX-Project.zip 拖到 EI自动编译.bat 上 —— 只编译这一个；
#   3) 把一个文件夹拖到 EI自动编译.bat 上 —— 直接监视该文件夹。
# 需要本机已安装 TeX Live 或 MiKTeX（需要 xelatex；有 latexmk 更好，没有也可以）。
param([string]$Target = "")

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "GalleyTeX 自动编译（XeLaTeX）"

function Get-DownloadsFolder {
    try {
        $reg = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" -ErrorAction Stop
        $v = $reg."{374DE290-123F-4565-9164-39C4925E38B}"
        if ($v) { return [Environment]::ExpandEnvironmentVariables($v) }
    } catch { }
    return (Join-Path $env:USERPROFILE "Downloads")
}

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
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    # 编译目录用纯 ASCII 路径（C:\Users\Public\galleytex-build），避免中文路径让 TeX 出问题
    $buildRoot = Join-Path $env:PUBLIC "galleytex-build"
    $dir = Join-Path $buildRoot ($stamp + "-" + $ascii)
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    try {
        Expand-Archive -LiteralPath $zipPath -DestinationPath $dir -Force
    } catch {
        Write-Host ("    解压失败：" + $_.Exception.Message) -ForegroundColor Red
        return
    }
    if (-not (Test-Path (Join-Path $dir "main.tex"))) {
        Write-Host "    ZIP 里没有 main.tex，跳过。" -ForegroundColor Yellow
        return
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
                $null = & $script:Engine.Path -xelatex -interaction=nonstopmode -file-line-error main.tex 2>&1
            } else {
                Write-Host ("    " + $script:Engine.Kind + " 第 " + $pass + " 遍…")
                $null = & $script:Engine.Path -interaction=nonstopmode -file-line-error main.tex 2>&1
            }
            $code = $LASTEXITCODE
            $log = ""
            if (Test-Path "main.log") { $log = [System.IO.File]::ReadAllText((Join-Path $dir "main.log")) }
            if ($code -ne 0 -or -not (Test-Path "main.pdf")) {
                Write-Host "    编译出错：" -ForegroundColor Red
                $errs = ($log -split "`r?`n") | Where-Object { $_ -match '^(!|main\.tex:\d+:)' } | Select-Object -First 8
                foreach ($e in $errs) { Write-Host ("      " + $e) -ForegroundColor Red }
                if ($script:Engine.Kind -eq "pdflatex" -and $log -match 'Unicode character') {
                    Write-Host "    提示：项目需要 XeLaTeX（中文或 Unicode 符号）。请在 TeX Live/MiKTeX 中安装 xelatex 后重试。" -ForegroundColor Yellow
                }
                $logCopy = Join-Path (Split-Path -Parent $zipPath) ($paperName + "-编译日志.log")
                Copy-Item "main.log" $logCopy -Force
                Write-Host ("    完整日志：" + $logCopy)
                Start-Process notepad.exe $logCopy
                [Console]::Beep(800, 300)
                return
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
        Copy-Item (Join-Path $dir "main.pdf") $pdfOut -Force
        Write-Host ("    完成：" + $pages + " 页 → " + $pdfOut) -ForegroundColor Green
        Write-Host ("    工程目录：" + $dir)
        Start-Process $pdfOut
    }
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
    Invoke-Compile (Resolve-Path -LiteralPath $Target).Path
    Read-Host "按回车键关闭"
    exit 0
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
    if (-not $watchDir -or -not (Test-Path -LiteralPath $watchDir)) { $watchDir = Get-DownloadsFolder }
    while ($true) {
        Write-Host ""
        Write-Host ("监视目录：" + $watchDir) -ForegroundColor Cyan
        Write-Host "  直接回车 = 用这个目录；输入其他路径回车 = 改用该路径；输入 s 回车 = 打开文件夹选择框"
        $ans = Read-Host "请选择"
        $ans = $ans.Trim().Trim('"')
        if (-not $ans) { break }
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
Write-Host "在排版工具里点“下载完整 LaTeX 项目压缩包”，ZIP 一落地就会自动编译并打开 PDF。按 Ctrl+C 退出。"

while ($true) {
    Start-Sleep -Seconds 2
    $files = Get-ChildItem -LiteralPath $watchDir -Filter "*-LaTeX-Project*.zip" -File -ErrorAction SilentlyContinue
    foreach ($f in $files) {
        $key = $f.FullName
        if ($seen.ContainsKey($key) -and $seen[$key] -eq $f.LastWriteTimeUtc.Ticks) { continue }
        if (-not (Wait-ForStable $key)) { continue }
        $seen[$key] = (Get-Item -LiteralPath $key).LastWriteTimeUtc.Ticks
        Invoke-Compile $key
        Write-Host ""
        Write-Host "继续监视中…（Ctrl+C 退出）"
    }
}
