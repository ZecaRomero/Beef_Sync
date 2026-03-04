Set WshShell = CreateObject("WScript.Shell")
Set oShellLink = WshShell.CreateShortcut(WshShell.CurrentDirectory & "\🐄 Beef Sync.lnk")

' Configurar atalho para usar o script que REALMENTE oculta tudo
oShellLink.TargetPath = "wscript.exe"
oShellLink.Arguments = Chr(34) & WshShell.CurrentDirectory & "\Iniciar-Limpo.vbs" & Chr(34)
oShellLink.WorkingDirectory = WshShell.CurrentDirectory
oShellLink.Description = "Beef Sync - Sistema de Gestão Pecuária (SEM janelas CMD)"
oShellLink.WindowStyle = 1

' Salvar atalho
oShellLink.Save

' Mensagem de sucesso
MsgBox "✅ Atalho criado com sucesso!" & vbCrLf & vbCrLf & _
       "Nome: 🐄 Beef Sync.lnk" & vbCrLf & vbCrLf & _
       "Este atalho:" & vbCrLf & _
       "✅ Oculta TODAS as janelas do CMD" & vbCrLf & _
       "✅ Mata processos antigos do Node.js" & vbCrLf & _
       "✅ Inicia servidor completamente oculto" & vbCrLf & _
       "✅ Abre navegador automaticamente" & vbCrLf & vbCrLf & _
       "Use este atalho sempre que quiser abrir o sistema!", _
       vbInformation, "Atalho Criado"

' Limpar objetos
Set oShellLink = Nothing
Set WshShell = Nothing
