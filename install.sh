#!/bin/sh

# Name:         install.sh
# Desription:   A script which will install ButterFi ontop of the existing LuCi installation on your device
# Version:      0.1
# Date:         2018-08-26
# Author:       Kevin Loeffler
# Website:      https://github.com/kevinl95/butterfi

cp -TRv butterfi/luci/ usr/lib/lua/luci/
cp -TRv butterfi/www/ www/
