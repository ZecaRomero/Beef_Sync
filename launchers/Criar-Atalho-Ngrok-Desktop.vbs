Set WshShell = CreateObject("WScript.Shell")
Set oShellLink = WshShell.CreateShortcut(WshShell.SpecialFolders("Desktop") & "\Beef-Sync + ngrok.lnk")

' Obter o diretório atual
currentDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

oShellLink.TargetPath = currentDir & "\INICIAR-BEEF-NGROK-COMPLETO.bat"
oShellLink.WorkingDirectory = currentDir
oShellLink.Description = "Inicia Beef-Sync + ngrok e abre navegadores (localhost + www.beefsync.ngrok.app)"
oShellLink.IconLocation = "C:\Windows\System32\shell32.dll,13"
oShellLink.Save

MsgBox "Atalho criado na Area de Trabalho!" & vbCrLf & vbCrLf & _
       "Nome: Beef-Sync + ngrok" & vbCrLf & vbCrLf & _
       "Clique duas vezes no atalho para:" & vbCrLf & _
       "- Iniciar o servidor Beef-Sync" & vbCrLf & _
       "- Iniciar o ngrok (www.beefsync.ngrok.app)" & vbCrLf & _
       "- Abrir localhost:3020 no navegador" & vbCrLf & _
       "- Abrir www.beefsync.ngrok.app no navegador", vbInformation, "Sucesso!"

Set oShellLink = Nothing
Set WshShell = Nothing
