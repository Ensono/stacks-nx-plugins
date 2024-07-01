[CmdletBinding()]
param (
  [string]
  $target = $env:target,

  [string]
  $identifier = $env:identifier,

  [string]
  $provider = $env:provider,

  [switch]
  $VerboseOutput
)

if ($VerboseOutput) {
  $VerbosePreference = 'Continue'
  Write-Verbose "Verbose mode enabled"
}

Set-Location -Path "./deploy/app/k8s-manifest"
Write-Verbose "Adding K8s manifests!"
Invoke-Kubectl -apply -arguments @("deployment.yaml", "service.yaml", "ingress.yaml") -provider $env:provider -target $env:target -identifier $env:identifier

