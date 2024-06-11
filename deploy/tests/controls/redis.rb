
control 'redis-instance-existence' do
  title 'Ensure Redis instance exists'
  desc 'Check that the Redis instance exists within the resource group'
  describe azure_redis_cache(resource_group: input("resource_group_name"), name: input("redis_name")) do
    it { should exist }
    its('name') { should cmp input("redis_name") }
  end
end

control 'redis-sku-and-size' do
  title 'Verify Redis SKU and size'
  desc 'Ensure the Redis instance has the correct SKU and size'
  describe azure_redis_cache(resource_group: input("resource_group_name"), name: input("redis_name")) do
    its('properties.sku.name') { should cmp input("redis_sku_name") }
    its('properties.sku.family') { should cmp input("redis_family") }
    its('properties.sku.capacity') { should cmp input("redis_capacity") }
  end
end

control 'redis-availability-status' do
  title 'Check Redis availability and status'
  desc 'Ensure the Redis instance is available and healthy'
  describe azure_redis_cache(resource_group: input("resource_group_name"), name: input("redis_name")) do
    its('properties.provisioningState') { should cmp 'Succeeded' }
    its('properties.hostName') { should_not be_nil }
    its('properties.port') { should cmp 6379 }
    its('properties.sslPort') { should cmp 6380 }
  end
end

control 'redis-configuration' do
  title 'Validate Redis configuration'
  desc 'Ensure Redis instance has correct configurations'
  
  # Extract the configuration string from the array
  redis_configuration_array = input('redis_configuration')
  redis_configuration_string = redis_configuration_array.first
  
  # Function to parse the configuration string into a hash
  def parse_redis_configuration(config_string)
    config_string.gsub(/[@{}]/, '')         # Remove '@', '{', and '}'
                 .split(';')                # Split by semicolon
                 .reject(&:empty?)          # Remove any empty strings
                 .map { |pair| pair.split('=', 2) } # Split each pair by '=', limit to 2 parts
                 .map { |k, v| [k&.strip, v&.strip] } # Strip whitespace from keys and values, handle nil
                 .to_h                      # Convert array of pairs to hash
  end

  # Parse the configuration string
  redis_configuration_formatted = parse_redis_configuration(redis_configuration_string)
  
  # Debugging output to check the parsed configuration
  describe "Parsed Redis Configuration" do
    subject { redis_configuration_formatted }
    it { should_not be_nil }
    it { should be_a(Hash) }
  end

  # Validate the Redis configuration
  describe azure_redis_cache(resource_group: input("resource_group_name"), name: input("redis_name")) do
    its('properties.redisConfiguration.maxmemory-reserved') { should cmp redis_configuration_formatted['maxmemory_reserved'] }
    its('properties.redisConfiguration.maxmemory-delta') { should cmp redis_configuration_formatted['maxmemory_delta'] }
    its('properties.redisConfiguration.maxmemory-policy') { should cmp redis_configuration_formatted['maxmemory_policy'] }
  end
end

