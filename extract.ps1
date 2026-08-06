Add-Type -AssemblyName System.IO.Compression.FileSystem
$docxPath = "Formulario Calificacion VillaVicario, de fb e ig a GHL.docx"
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $docxPath))
$entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

$matches = [regex]::Matches($content, '<w:p[ >].*?</w:p>')
foreach ($match in $matches) {
    $pText = [regex]::Replace($match.Value, '<[^>]+>', '')
    if ($pText.Trim() -ne '') {
        Write-Output $pText
    }
}
