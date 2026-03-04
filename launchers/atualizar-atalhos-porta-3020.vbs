Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Caminho da pasta atual
currentPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Caminho da área de trabalho
desktopPath = WshShell.SpecialFolders("Desktop")

' Criar atalho principal - BEEF SYNC (Porta 3020)
Set shortcut1 = WshShell.CreateShortcut(desktopPath & "\Beef Sync (Porta 3020).lnk")
shortcut1.TargetPath = currentPath & "\BEEF-SYNC-PORTA-3020.bat"
shortcut1.WorkingDirectory = currentPath
shortcut1.Description = "Beef Sync - Sistema de Gestão Bovina - Porta Fixa 3020"
shortcut1.IconLocation = currentPath & "\beef-sync-icon.svg"
shortcut1.Save

' Criar atalho de rede - BEEF SYNC (Rede - Porta 3020)
Set shortcut2 = WshShell.CreateShortcut(desktopPath & "\Beef Sync (Rede - Porta 3020).lnk")
shortcut2.TargetPath = currentPath & "\start-beef-sync-network.bat"
shortcut2.WorkingDirectory = currentPath
shortcut2.Description = "Beef Sync - Acesso em Rede Local - Porta 3020"
shortcut2.IconLocation = currentPath & "\beef-sync-icon.svg"
shortcut2.Save

' Remover atalhos antigos se existirem
On Error Resume Next
fso.DeleteFile desktopPath & "\Beef Sync.lnk"
fso.DeleteFile desktopPath & "\Beef Sync (Rede).lnk"
fso.DeleteFile desktopPath & "\BeefSync.lnk"
On Error GoTo 0

WScript.Echo "✅ Atalhos atualizados com sucesso!"
WScript.Echo ""
WScript.Echo "Novos atalhos criados:"
WScript.Echo "• Beef Sync (Porta 3020) - Acesso local"
WScript.Echo "• Beef Sync (Rede - Porta 3020) - Acesso em rede"
WScript.Echo ""
WScript.Echo "🎯 PORTA PADRONIZADA: 3020"
WScript.Echo "📊 Novas funcionalidades de contabilidade incluídas!"