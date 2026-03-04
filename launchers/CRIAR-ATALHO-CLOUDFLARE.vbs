Set WshShell = CreateObject("WScript.Shell")
Set oShellLink = WshShell.CreateShortcut(WshShell.SpecialFolders("Desktop") & "\Beef-Sync Cloudflare.lnk")

' Caminho do script
oShellLink.TargetPath = WshShell.CurrentDirectory & "\SETUP-CLOUDFLARE-COMPLETO.bat"
oShellLink.WorkingDirectory = WshShell.CurrentDirectory
oShellLink.Description = "Abrir Beef-Sync com Cloudflare Tunnel (sem limites)"
oShellLink.IconLocation = "shell32.dll,13"
oShellLink.Save

MsgBox "Atalho criado na area de trabalho!" & vbCrLf & vbCrLf & "Nome: Beef-Sync Cloudflare", vbInformation, "Sucesso"
