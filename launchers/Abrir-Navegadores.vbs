Set WshShell = CreateObject("WScript.Shell")
Set objHTTP = CreateObject("MSXML2.ServerXMLHTTP")

' Abrir localhost:3020
WshShell.Run "http://localhost:3020", 1

' Aguardar 2 segundos
WScript.Sleep 2000

' Tentar obter a URL do ngrok automaticamente
On Error Resume Next
objHTTP.Open "GET", "http://localhost:4040/api/tunnels", False
objHTTP.Send

If objHTTP.Status = 200 Then
    ' Extrair a URL pública do ngrok
    responseText = objHTTP.responseText
    
    ' Procurar por "public_url":"https://
    startPos = InStr(responseText, """public_url"":""https://")
    If startPos > 0 Then
        startPos = startPos + 15 ' Pular até o início da URL
        endPos = InStr(startPos, responseText, """")
        ngrokUrl = Mid(responseText, startPos, endPos - startPos)
        
        ' Abrir a URL do ngrok
        WshShell.Run ngrokUrl, 1
        
        MsgBox "Navegadores abertos com sucesso!" & vbCrLf & vbCrLf & _
               "Localhost: http://localhost:3020" & vbCrLf & _
               "Ngrok: " & ngrokUrl, vbInformation, "Beef-Sync"
    Else
        ' Se não encontrou a URL, abrir a interface do ngrok
        WshShell.Run "http://localhost:4040", 1
        MsgBox "Localhost aberto!" & vbCrLf & vbCrLf & _
               "Não foi possível detectar a URL do ngrok automaticamente." & vbCrLf & _
               "A interface do ngrok foi aberta para você copiar a URL.", vbExclamation, "Beef-Sync"
    End If
Else
    ' Se o ngrok não está rodando, apenas abrir o localhost
    MsgBox "Localhost aberto em http://localhost:3020" & vbCrLf & vbCrLf & _
           "AVISO: O ngrok não parece estar rodando." & vbCrLf & _
           "Execute o ngrok primeiro se precisar acessar pela internet.", vbExclamation, "Beef-Sync"
End If

Set objHTTP = Nothing
Set WshShell = Nothing
