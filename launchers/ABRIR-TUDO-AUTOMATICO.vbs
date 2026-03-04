Set WshShell = CreateObject("WScript.Shell")

' Iniciar Beef-Sync em uma janela
WshShell.Run "cmd /c title Beef-Sync Server && npm run dev", 1, False

' Aguardar 30 segundos
WScript.Sleep 30000

' Iniciar Cloudflare Tunnel em outra janela
WshShell.Run "cmd /c title Cloudflare Tunnel && cloudflared.exe tunnel --url http://localhost:3020", 1, False

MsgBox "Beef-Sync e Cloudflare Tunnel iniciados!" & vbCrLf & vbCrLf & "Aguarde alguns segundos e verifique a URL na janela do Cloudflare Tunnel.", vbInformation, "Sucesso"

Set WshShell = Nothing
