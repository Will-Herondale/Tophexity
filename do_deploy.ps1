$tmp = Join-Path $env:TEMP "deploy_tophexity"
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

Copy-Item -Path "C:\DefaultStuff\hack4hyd\app" -Destination "$tmp\app" -Recurse
Copy-Item -Path "C:\DefaultStuff\hack4hyd\alembic" -Destination "$tmp\alembic" -Recurse
Copy-Item "C:\DefaultStuff\hack4hyd\function_app.py" "$tmp\"
Copy-Item "C:\DefaultStuff\hack4hyd\requirements.txt" "$tmp\"
Copy-Item "C:\DefaultStuff\hack4hyd\api_key.txt" "$tmp\"
Copy-Item "C:\DefaultStuff\hack4hyd\.env" "$tmp\"

Get-ChildItem $tmp -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force

Compress-Archive -Path "$tmp\*" -DestinationPath "C:\DefaultStuff\hack4hyd\deploy.zip" -Force
Remove-Item $tmp -Recurse -Force
Write-Host "Done: deploy.zip created"
