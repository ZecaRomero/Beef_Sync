Set WshShell = CreateObject("WScript.Shell")
Set oShellLink = WshShell.CreateShortcut(WshShell.SpecialFolders("Desktop") & "\Beef-Sync COMPLETO.lnk")

' Obter o diretório atual
currentDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

oShellLink.TargetPath = currentDir & "\INICIAR-BEEF-COMPLETO.bat"
oShellLink.WorkingDirectory = currentDir
oShellLink.Description = "Inicia Beef-Sync + Cloudflare Tunnel e abre navegadores"
oShellLink.IconLocation = "C:\Windows\System32\shell32.dll,13"
oShellLink.Save

MsgBox "Atalho criado na Area de Trabalho!" & vbCrLf & vbCrLf & _
       "Nome: Beef-Sync COMPLETO" & vbCrLf & vbCrLf & _
       "Clique duas vezes no atalho para:" & vbCrLf & _
       "- Iniciar o servidor Beef-Sync" & vbCrLf & _
       "- Iniciar o Cloudflare Tunnel" & vbCrLf & _
       "- Abrir localhost no navegador" & vbCrLf & _
       "- Mostrar URL para o celular", vbInformation, "Sucesso!"

Set oShellLink = Nothing
Set WshShell = Nothing
