title "Resource Group"

# Ensure that the resource group exists, is in the correct location and
# has been provisionned successfully
describe azure_resource_group(name: input("resource_group_name")) do
  it { should exist }
  its("location") { should cmp input("resource_group_location") }
  its("properties.provisioningState") { should cmp "Succeeded" }
end
