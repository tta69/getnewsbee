$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git add .

if (!(git diff --cached --quiet)) {
    git commit -m "sync: $timestamp"
    git push
    Write-Output "Valtozasok feltoltve GitHubra ($timestamp)"
} else {
    Write-Output "Nincs valtozas, nincs mit commitolni."
}
