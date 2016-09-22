#!/usr/bin/env tarantool
box.cfg{
  listen = 3301,
  work_dir = "db"
}

local s =  box.space.anchat_users
if not s then
    s = box.schema.space.create('anchat_users')
    p = s:create_index('primary', {type = 'tree', parts = {1, 'NUM'}})
end