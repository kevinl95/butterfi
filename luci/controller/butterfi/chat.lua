-- Copyright 2008 Steven Barth <steven@midlink.org>
-- Copyright 2008 Jo-Philipp Wich <jow@openwrt.org>
-- Licensed to the public under the Apache License 2.0.

module("luci.controller.butterfi.chat", package.seeall)

function index()
	entry( {"butterfi", "chat"}, template("cbi/chat")).dependent = false
end
