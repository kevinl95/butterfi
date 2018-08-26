![ButterFi Logo](http://butterfi.net/images/logo.png "ButterFi Logo")

# ButterFi

Teachers today have to contend with classrooms that have many different devices in them, such as Chromebooks, iPads, and Android tablets. ButterFi is a project to build one classroom device management system that works for all of these platforms by working through the web browser, as well as replace many cloud services that are costly and can potentially compromise your students' data. ButterFi runs on a box in your classroom, so you are always in control and access is only available for people located within your building.

ButterFi is free, open-source software that runs on certain internet routers supported by the OpenWrt project. It is currently in early development and will feature software to let you filter your student's internet as well as provide cloud services that are hosted in your classroom, so you need to be near the box to access them, keeping your student's data safe from online criminals. If it ever goes down, you can fix it yourself and the only cost to you as a teacher is the price of a supported router!

ButterFi is built to extend the existing LuCi interface available on OpenWrt routers.

[Get more information on our website!](www.butterfi.net)

# Features

* ButterFi sits between your students and the school network as a wireless repeater, letting you restrict sites and even turn the internet off when you want students working.
* Share files with your class that are stored on mounted USB storage, such as a flash drive, using a simple web interface
* Have your students upload files to you using a simple upload page
* Let your students collaborate via chat that can only be accessed in the classroom
* ButterFi works in the browser, so it works on Chromebooks, iPads, Android tablets, laptops, and any other device with a web browser

# Tested Devices

Since ButterFi is in early development, we only have tested it on a limited number of devices at this time, but you are free to experiment and try to run it on other OpenWrt compatible hardware, such as the Raspberry Pi 3!

* [GL-AR150 Series Travel Routers](https://docs.gl-inet.com/en/2/hardware/ar150/)

# Installation

We are currently working on making installation more simple. At this time, installation is unfortunately somewhat manual.

We assume that you have a device like the GL-AR150 that is already running OpenWrt with LuCi. If you do not already have LuCi installed, which is a graphical web interface for your router, you can learn about installing it [here.](https://github.com/openwrt/luci). To check if you have it, connect to your router and enter [192.168.1.1](192.168.1.1) in your web browser. You should see a login screen, indicating that LuCi is installed.

Make sure you know what your username and password are- if you have not changed them by default your username will be either 'admin' or 'root' and your password 'password'. You should change this later for security.

The default address to enter in your browser to access the graphical interface is 192.168.1.1. On some routers, such as the GL-AR150, it is actually 192.168.8.1. Check the documentation for your router to get the correct address and use it whenever this guide refers to 192.168.1.1.

1. Clone this repository and move it to your device either by cloning it to the root directory directly or copying it using SCP (if you do not know how to do this, [WinSCP](https://winscp.net/eng/index.php) is free software that makes this process graphical- simply download it, choose the SCP option, enter 192.168.1.1 for the address and your username and password, then drag the ButterFi file over into the root directory)
2. SSH into your router. This lets you run commands on your router. A good client for this is [PuTTY](https://www.putty.org/) which you can download for free. Simply enter 192.168.1.1 as the address and your username and password and you should be connected.
3. Connect the USB drive you want to use with ButterFi to the USB port. This should be a flashdrive or similar device.
4. We need to set up USB if it has not already been set up. Simply enter each command, one line at a time, pressing enter in between each line.
```
# Copy/paste each line below, then press Return
opkg update && opkg install block-mount e2fsprogs kmod-fs-ext4 kmod-usb3 kmod-usb2 kmod-usb-storage
mkfs.ext4 /dev/sda1
block detect > /etc/config/fstab
uci set fstab.@mount[0].enabled='1' && uci set fstab.@global[0].check_fs='1' && uci commit
/sbin/block mount && service fstab enable
```
USB is now configured and set up. You will not need to do this again unless you reinstall ButterFi. If you receive messages saying that these packages are already setup and configured, move on to the next step.
5. We need to install PHP for certain ButterFi functions to work, such as Chat. PHP is a server-side language that gives us powerful tools for making ButterFI interactive for your students. Enter the following commands:
```
opkg update
opkg list php*
```
Once this is finished, enter the following to install PHP:
```
opkg install php5 php5-cgi lighttpd-mod-cgi
```
6. From the root directory on OpenWrt, execute the install script (install.sh). You can do this by entering `sh /butterfi/install.sh`. This copies the luci and www directories into their correct locations on your router.
7. Reboot your router by turning it off and turning it back on.
8. Navigate to http://192.168.1.1/cgi-bin/luci/butterfi/home

ButterFi should now be displayed. Click 'Teacher Login' and enter your username and password. You will be presented with an easy QR code to distribute to your students to make getting to ButterFi easy and simple.

From the teacher admin panel you can also navigate to Network and Wifi to scan for your school network and get connected. For more information as to how to do this, click [here](https://openwrt.org/docs/guide-user/network/wifi/relay_configuration#setup_with_luci_gui).
