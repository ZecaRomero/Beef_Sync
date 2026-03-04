Set WshShell = CreateObject("WScript.Shell")
Set oShellLink = WshShell.CreateShortcut(WshShell.CurrentDirectory & "\Beef Sync.lnk")

' Configurar atalho
oShellLink.TargetPath = "wscript.exe"
oShellLink.Arguments = Chr(34) & WshShell.CurrentDirectory & "\Abrir-BeefSync.vbs" & Chr(34)
oShellLink.WorkingDirectory = WshShell.CurrentDirectory
oShellLink.Description = "Beef Sync - Sistema de Gestão Pecuária"
oShellLink.IconLocation = WshShell.CurrentDirectory & "\beef-sync-icon.svg,0"
oShellLink.WindowStyle = 1

' Salvar atalho
oShellLink.Save

' Mensagem de sucesso
MsgBox "Atalho 'Beef Sync.lnk' criado com sucesso!" & vbCrLf & vbCrLf & _
       "Agora você pode:" & vbCrLf & _
       "1. Clicar duas vezes no atalho para abrir o sistema" & vbCrLf & _
       "2. As janelas do CMD ficarão ocultas" & vbCrLf & _
       "3. O navegador abrirá automaticamente", _
       vbInformation, "Atalho Criado"

' Limpar objetos
Set oShellLink = Nothing
Set WshShell = Nothing
