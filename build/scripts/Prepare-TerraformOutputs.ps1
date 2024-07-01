[CmdletBinding()]
param (
  [string]
  $Terraform_File_Directory = $env:TF_FILE_LOCATION,

  [string]
  $Environment = $env:TF_VAR_name_environment,

  [switch]
  $VerboseOutput
)

if ($VerboseOutput) {
  $VerbosePreference = 'Continue'
  Write-Verbose "Verbose mode enabled"
}

Write-Verbose "Terraform File Directory: $Terraform_File_Directory"
Write-Verbose "Environment: $Environment"

# Check if the directory parameter is provided
if (!$Terraform_File_Directory) {
  throw "Terraform file directory is required."
}

# Check if the environment parameter is provided
if (!$Environment) {
  throw "Environment is required."
}

Invoke-Terraform -Workspace -Arguments $Environment -Path $Terraform_File_Directory
Write-Verbose "Invoked Terraform with workspace argument"

Invoke-Terraform -Output -Path $Terraform_File_Directory | /app/build/scripts/Set-EnvironmentVars.ps1 -prefix "TFOUT" -key "value" -passthru | ConvertTo-Yaml | Out-File -Path ${PWD}/tf_outputs.yml
Write-Verbose "Generated tf_outputs.yml @ ${PWD}"
