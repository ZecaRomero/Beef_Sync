Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Verificar se o atalho antigo existe e deletar
Dim atalhoAntigo
atalhoAntigo = WshShell.CurrentDirectory & "\🐄 Beef Sync.lnk"
If FSO.FileExists(atalhoAntigo) Then
    FSO.DeleteFile atalhoAntigo
End If

' Criar novo atalho
Set oShellLink = WshShell.CreateShortcut(atalhoAntigo)

' Configurar atalho para usar o script SIMPLES (sem matar processos)
oShellLink.TargetPath = "wscript.exe"
oShellLink.Arguments = Chr(34) & WshShell.CurrentDirectory & "\Abrir-Beef-Sync-Simples.vbs" & Chr(34)
oShellLink.WorkingDirectory = WshShell.CurrentDirectory
oShellLink.Description = "Beef Sync - Sistema de Gestão Pecuária"
oShellLink.WindowStyle = 1

' Salvar atalho
oShellLink.Save

' Mensagem de sucesso
MsgBox "✅ Atalho atualizado com sucesso!" & vbCrLf & vbCrLf & _
       "Agora use o atalho '🐄 Beef Sync.lnk'" & vbCrLf & vbCrLf & _
       "Melhorias:" & vbCrLf & _
       "✅ Não mata processos antigos" & vbCrLf & _
       "✅ Janelas do CMD ficam ocultas" & vbCrLf & _
       "✅ Abre navegador automaticamente" & vbCrLf & _
       "✅ Mais estável e confiável", _
       vbInformation, "Atalho Atualizado"

' Limpar objetos
Set oShellLink = Nothing
Set FSO = Nothing
Set WshShell = Nothing
