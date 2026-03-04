' Executa o Beef Sync sem mostrar janela do PowerShell
' Use este arquivo como alvo do atalho para evitar tela preta
Set FSO = CreateObject("Scripting.FileSystemObject")
scriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptDir & "\start-beef-sync.ps1""", 0, False
