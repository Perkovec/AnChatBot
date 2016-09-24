#!/usr/bin/env tarantool
local config = require('tarantool_config');

box.cfg{
  listen = 3301,
  work_dir = 'db'
}

local public_functions = {
  'new_chat_user'
}

function new_chat_user(data)
  print(data.lol)
end

function createFunctions()
  local file = io.open('../.tarantool_functions', 'w')
  for i = 1, #public_functions do
    local func = box.schema.func.create(public_functions[i])
    file:write(tostring(box.space._func:len())..'\n')
    box.schema.user.grant(config.username, 'execute', 'function', public_functions[i])
  end
  file:close()
end

function removeFunctions()
  local file = io.open('../.tarantool_functions')
  if file then
    while true do
      local line = file:read()
      if line == nil then break end
      local func = box.space._func:select{tonumber(line)}
      box.schema.user.revoke(config.username, 'execute', 'function', func[1][3]);
      box.schema.func.drop(func[1][3])
    end
    file:close()
    file = io.open('../.tarantool_functions', 'w')
  else
    file = io.open('../.tarantool_functions', 'w')
  end
  file:write('')
  file:close()
end

function createUser()
  box.schema.user.create(config.username, {password = config.password})
  box.schema.user.grant(config.username, 'read,write', 'space', 'anchat_users')
end

local s =  box.space.anchat_users
if not s then
    s = box.schema.space.create('anchat_users')
    p = s:create_index('primary', {type = 'tree', parts = {1, 'NUM'}})
    createUser()
end

removeFunctions();
createFunctions();