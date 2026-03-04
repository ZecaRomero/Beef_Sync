Set WshShell = CreateObject("WScript.Shell")
Set objHTTP = CreateObject("MSXML2.ServerXMLHTTP.6.0")

' Função para verificar se o servidor está rodando
Function ServidorRodando()
    On Error Resume Next
    objHTTP.Open "GET", "http://localhost:3020", False
    objHTTP.setTimeouts 1000, 1000, 1000, 1000
    objHTTP.Send
    
    If Err.Number = 0 And objHTTP.Status = 200 Then
        ServidorRodando = True
    Else
        ServidorRodando = False
    End If
    On Error GoTo 0
End Function

' Verificar se o servidor já está rodando
If ServidorRodando() Then
    ' Servidor já está rodando, apenas abrir navegador
    WshShell.Run "http://localhost:3020", 1, False
Else
    ' Servidor não está rodando, iniciar em segundo plano (OCULTO)
    WshShell.Run "cmd /c npm run dev", 0, False
    
    ' Aguardar servidor inicializar (máximo 30 segundos)
    Dim tentativas
    tentativas = 0
    Do While tentativas < 30 And Not ServidorRodando()
        WScript.Sleep 1000
        tentativas = tentativas + 1
    Loop
    
    ' Abrir navegador
    WshShell.Run "http://localhost:3020", 1, False
End If

' Limpar objetos
Set objHTTP = Nothing
Set WshShell = Nothing
