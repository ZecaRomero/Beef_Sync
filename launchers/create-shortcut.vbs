Set WshShell = CreateObject("WScript.Shell")

' Descobrir pasta Desktop (compatível com OneDrive Desktop)
Dim desktopPath
desktopPath = WshShell.SpecialFolders("Desktop")
If desktopPath = "" Then
  desktopPath = WshShell.ExpandEnvironmentStrings("%UserProfile%") & "\Desktop"
End If

Set oMyShortcut = WshShell.CreateShortcut(desktopPath & "\Beef Sync.lnk")

' Apontar para o lançador estável
oMyShortcut.TargetPath = "C:\Users\zeca8\Documents\Sistemas\Beef-Sync_TOP _1\BeefSync.bat"
oMyShortcut.WorkingDirectory = "C:\Users\zeca8\Documents\Sistemas\Beef-Sync_TOP _1"
oMyShortcut.Description = "Beef Sync - Sistema de Gestao"
oMyShortcut.Save

WScript.Echo "Atalho atualizado com sucesso na Área de Trabalho!"
