Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cloudflared.exe tunnel --url http://localhost:3020", 0, False
Set WshShell = Nothing
