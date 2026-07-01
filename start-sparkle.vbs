' ============================================================
' Sparkle Log — silent startup launcher
'
' Drag this file into: shell:startup
' It runs start-sparkle.bat silently (no terminal window).
' ============================================================

CreateObject("WScript.Shell").Run _
    """" & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\start-sparkle.bat""", _
    0, False
