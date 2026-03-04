Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Caminho da pasta atual
currentPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Caminho da área de trabalho
desktopPath = WshShell.SpecialFolders("Desktop")
If desktopPath = "" Then
  desktopPath = WshShell.ExpandEnvironmentStrings("%UserProfile%") & "\Desktop"
End If

' Remover TODOS os atalhos antigos
On Error Resume Next
fso.DeleteFile desktopPath & "\Beef Sync.lnk"
fso.DeleteFile desktopPath & "\Beef Sync (Rede).lnk"
fso.DeleteFile desktopPath & "\Beef Sync (Rede).url"
fso.DeleteFile desktopPath & "\Beef Sync (Porta 3020).lnk"
fso.DeleteFile desktopPath & "\Beef Sync (Rede - Porta 3020).lnk"
fso.DeleteFile desktopPath & "\BeefSync.lnk"
On Error GoTo 0

' Criar APENAS UM atalho unificado
Set shortcut = WshShell.CreateShortcut(desktopPath & "\Beef Sync.lnk")
shortcut.TargetPath = currentPath & "\BEEF-SYNC-UNIFICADO.bat"
shortcut.WorkingDirectory = currentPath
shortcut.Description = "Beef Sync - Sistema de Gestão Bovina (Porta 3020) - Local e Rede"
shortcut.IconLocation = currentPath & "\beef-sync-icon.svg"
shortcut.Save

WScript.Echo "✅ Atalho unificado criado com sucesso!"
WScript.Echo ""
WScript.Echo "📌 Um único ícone na área de trabalho:"
WScript.Echo "   🔗 Beef Sync"
WScript.Echo ""
WScript.Echo "🌐 Funciona para:"
WScript.Echo "   • Acesso local (localhost:3020)"
WScript.Echo "   • Acesso em rede (192.168.x.x:3020)"
WScript.Echo ""
WScript.Echo "🎯 PORTA PADRONIZADA: 3020"

