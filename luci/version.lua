local pcall, dofile, _G = pcall, dofile, _G

module "luci.version"

if pcall(dofile, "/etc/openwrt_release") and _G.DISTRIB_DESCRIPTION then
	distname    = ""
	distversion = _G.DISTRIB_DESCRIPTION
else
	distname    = "OpenWrt"
	distversion = "Development Snapshot"
end

luciname    = "LuCI 15.05-54-gfd60055 Release"
luciversion = "git-15.363.78009-956be55"
