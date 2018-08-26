-- Copyright 2008 Steven Barth <steven@midlink.org>
-- Copyright 2008 Jo-Philipp Wich <jow@openwrt.org>
-- Licensed to the public under the Apache License 2.0.

module("luci.controller.butterfi.teacherfiles", package.seeall)

function index()
	entry( {"butterfi", "teacherfiles"}, template("cbi/teacherfiles")).dependent = false
end
