' Cria um atalho de Internet (.url) na Área de Trabalho
' apontando para o IP local, para acesso via rede.

On Error Resume Next

Dim WshShell, fso, desktopPath, ipAddress, shortcutPath
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Usa a pasta Desktop do usuário (compatível com OneDrive Desktop)
desktopPath = WshShell.SpecialFolders("Desktop")
If desktopPath = "" Then
  ' Fallback para casos raros em que SpecialFolders falha
  desktopPath = WshShell.ExpandEnvironmentStrings("%UserProfile%") & "\Desktop"
End If

' Descobrir IPv4 local (ignorando 127.* e 169.254.*)
ipAddress = ""
Dim objWMIService, colAdapters, objAdapter, arrIPs, i, ip
Set objWMIService = GetObject("winmgmts:\\.\root\cimv2")
Set colAdapters = objWMIService.ExecQuery("SELECT * FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled=TRUE")
For Each objAdapter In colAdapters
  arrIPs = objAdapter.IPAddress
  If IsArray(arrIPs) Then
    For i = 0 To UBound(arrIPs)
      ip = arrIPs(i)
      If InStr(ip, ".") > 0 Then
        If Left(ip, 4) <> "127." And Left(ip, 8) <> "169.254" Then
          ipAddress = ip
          Exit For
        End If
      End If
    Next
  End If
  If ipAddress <> "" Then Exit For
Next

If ipAddress = "" Then ipAddress = "localhost"

' Criar arquivo .url na Área de Trabalho
shortcutPath = desktopPath & "\Beef Sync (Rede).url"
Dim file
Set file = fso.CreateTextFile(shortcutPath, True)
file.WriteLine("[InternetShortcut]")
file.WriteLine("URL=http://" & ipAddress & ":3000/")
file.WriteLine("IDList=")
file.Close

WScript.Echo "Atalho criado na Área de Trabalho: " & shortcutPath & vbCrLf & _
             "URL: http://" & ipAddress & ":3000/"