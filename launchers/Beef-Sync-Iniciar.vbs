Set WshShell = CreateObject("WScript.Shell")

' Obter caminho do script PowerShell
Dim scriptPath
scriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
Dim psScript
psScript = scriptPath & "\Abrir-BeefSync-Oculto.ps1"

' Executar PowerShell de forma COMPLETAMENTE oculta
WshShell.Run "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & psScript & """", 0, False

' Limpar
Set WshShell = Nothing
