
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
    its('sku.name') { should cmp input("redis_sku_name") }
    its('sku.family') { should cmp input("redis_family") }
    its('sku.capacity') { should cmp input("redis_capacity") }
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

  describe command("az redis show --resource-group #{input('resource_group_name')} --name #{input('redis_name')} --query properties.redisConfiguration") do
    its('stdout') { should include '"maxmemory-reserved": "200mb"' }
    its('stdout') { should include '"maxmemory-delta": "200mb"' }
    its('stdout') { should include '"maxmemory-policy": "allkeys-lru"' }
  end
end
