[CmdletBinding()]
param (
  [string]
  $add_redis_key = $env:add_redis_key,

  [string]
  $redis_hostname = $env:TFOUT_redis_hostname,

  [string]
  $redis_port = $env:TFOUT_redis_port,

  [string]
  $redis_primary_access_key = $env:TFOUT_redis_primary_access_key,

  [string]
  $target = $env:target,

  [string]
  $identifier = $env:identifier,

  [string]
  $provider = $env:provider,

  [string]
  $secretName = "nx-secret",

  [switch]
  $VerboseOutput
)

# Set the Verbose Output Switch if you want to get log outputs when running TaskCTL
if ($VerboseOutput) {
  $VerbosePreference = 'Continue'
  Write-Verbose "Verbose mode enabled"
}

# Validate that all required parameters are populated
$requiredParams = @{
  redis_hostname           = $redis_hostname
  redis_port               = $redis_port
  redis_primary_access_key = $redis_primary_access_key
  target                   = $target
  identifier               = $identifier
  provider                 = $provider
}

foreach ($param in $requiredParams.GetEnumerator()) {
  if (-not $param.Value) {
    Write-Error "The parameter '$($param.Key)' is required."
    exit 1
  }
}

# Obviously this is highly static, it would need tweaking for dynamicism!
if ($env:add_redis_key -eq "true") {

  # Construct and output the secret in base64 - this is required for ALL K8s secrets to not have symbol conflicts,
  # they will be decoded when fetched by the application.
  Write-Verbose "Generating K8s Secret"
  $redis_connection_string = "$($redis_hostname):$($redis_port),password=$($redis_primary_access_key),ssl=True,abortConnect=False"
  $base64EncodedString = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($redis_connection_string))
  Write-Verbose "Base64 Encoded String: $base64EncodedString"

  # Ensure that the secret isn't present, and add. If it is, skip this step entirely.
  Write-Verbose "Logging Into K8s & Seeing If Secret Exists"
  $secretExists = Invoke-Kubectl -custom -arguments @("get secret $secretName --ignore-not-found") -provider $env:provider -target $env:target -identifier $env:identifier

  if ($secretExists) {
    Write-Verbose "Secret '$secretName' already exists. No need to create a new one."
  }
  else {
    Write-Verbose "Secret '$secretName' does not exist. Creating a new secret."
    # Create the Kubernetes secret
    Invoke-Kubectl -custom -arguments @("create secret generic nx-secret --from-literal=redis_connection_string='$base64EncodedString'") -provider $env:provider -target $env:target -identifier $env:identifier
    Write-Verbose "Completed K8s Secret creation"
  }

  Write-Verbose "Completed K8s Secret Apply"
}

