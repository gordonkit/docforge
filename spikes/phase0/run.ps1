# Phase 0 fidelity spike: HTML samples -> DOCX (gordon-doc/Pandoc) -> PDF (Word COM) -> PNG pages.
# Requires: pandoc, Microsoft Word, and gordon-doc-converter installed with
#   uv sync --extra word --extra images
param([string]$GordonDoc = "$PSScriptRoot\..\..\..\gordon-doc-converter\.venv\Scripts\gordon-doc.exe")
$ErrorActionPreference = 'Stop'
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
Set-Location $PSScriptRoot
Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force out\word | Out-Null
foreach ($f in Get-ChildItem samples\*.html) {
  & $GordonDoc convert $f.FullName --to docx -o "out\$($f.BaseName).docx" --overwrite
  & $GordonDoc convert "out\$($f.BaseName).docx" --to pdf --engine word-com -o "out\word\$($f.BaseName).pdf" --overwrite
  & $GordonDoc convert "out\word\$($f.BaseName).pdf" --to images -o "out\word\$($f.BaseName)-img" --overwrite --dpi 70
}
