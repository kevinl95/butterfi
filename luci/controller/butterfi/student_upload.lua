-- Copyright 2008 Steven Barth <steven@midlink.org>
-- Copyright 2008 Jo-Philipp Wich <jow@openwrt.org>
-- Licensed to the public under the Apache License 2.0.
module("luci.controller.butterfi.student_upload", package.seeall)

function index()
	entry( {"butterfi", "student_upload"}, template("cbi/student_upload", call("uploader"))).dependent = false
end

function uploader()
   file_loc = "/www/butterfifiles/studentuploads"
   input_field = "input-name"
   local values = luci.http.formvalue()
   local ul = values[input_field]
	 local sys = require "luci.sys"
	 local fs = require "nixio.fs"
	 local fp
	 luci.http.setfilehandler(
	 		function(meta, chunk, eof)
				if not fp then
					if meta then
						fp=io.open(file_loc .. meta.file, 'w')
					end
				end
				if chunk then
					fp:write(chunk)
				end
				if eof then
					fp:close()
				end
			end
	 )
   luci.template.render("butterfi/student_upload")
end
