Set WshShell = CreateObject("WScript.Shell")
Set objWMIService = GetObject("winmgmts:\\.\root\cimv2")

' Função para verificar se o servidor está rodando
Function ServidorRodando()
    On Error Resume Next
    Set objHTTP = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    objHTTP.Open "GET", "http://localhost:3020", False
    objHTTP.setTimeouts 1000, 1000, 1000, 1000
    objHTTP.Send
    
    If Err.Number = 0 And objHTTP.Status = 200 Then
        ServidorRodando = True
    Else
        ServidorRodando = False
    End If
    Set objHTTP = Nothing
    On Error GoTo 0
End Function

' Verificar se já está rodando
If ServidorRodando() Then
    ' Apenas abrir navegador
    WshShell.Run "http://localhost:3020", 1, False
Else
    ' Matar processos node.js antigos (se houver)
    Set colProcesses = objWMIService.ExecQuery("SELECT * FROM Win32_Process WHERE Name = 'node.exe'")
    For Each objProcess in colProcesses
        objProcess.Terminate()
    Next
    
    ' Aguardar um pouco
    WScript.Sleep 1000
    
    ' Iniciar servidor COMPLETAMENTE oculto usando PowerShell
    Dim scriptPath, psCommand
    scriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
    
    ' Comando PowerShell para iniciar npm run dev oculto
    psCommand = "powershell.exe -WindowStyle Hidden -Command """ & _
                "cd '" & scriptPath & "'; " & _
                "$psi = New-Object System.Diagnostics.ProcessStartInfo; " & _
                "$psi.FileName = 'cmd.exe'; " & _
                "$psi.Arguments = '/c npm run dev'; " & _
                "$psi.WindowStyle = 'Hidden'; " & _
                "$psi.CreateNoWindow = $true; " & _
                "$psi.UseShellExecute = $false; " & _
                "[System.Diagnostics.Process]::Start($psi) | Out-Null" & _
                """"
    
    ' Executar comando oculto
    WshShell.Run psCommand, 0, False
    
    ' Aguardar servidor inicializar
    Dim tentativas
    tentativas = 0
    Do While tentativas < 30 And Not ServidorRodando()
        WScript.Sleep 1000
        tentativas = tentativas + 1
    Loop
    
    ' Abrir navegador
    WshShell.Run "http://localhost:3020", 1, False
End If

' Limpar
Set objWMIService = Nothing
Set WshShell = Nothing
