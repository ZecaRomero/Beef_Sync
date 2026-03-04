Set WshShell = CreateObject("WScript.Shell")

' Ocultar janela do CMD ao executar npm run dev
WshShell.Run "cmd /c npm run dev", 0, False

' Aguardar 5 segundos para o servidor iniciar
WScript.Sleep 5000

' Abrir navegador
WshShell.Run "http://localhost:3020", 1, False

' Limpar objeto
Set WshShell = Nothing
