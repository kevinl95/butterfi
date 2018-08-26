
/*Display readable information on interface*/
var dic={};
dic["dhcp"]="DHCP";
dic["pppoe"]="PPPoE";
dic["static"]="Static";
dic["phone"]="Tethering"
dic["wisp"]="WISP";
dic["wds"]="WDS";
dic["3g"]="3G";
dic["11b"]="11M";
dic["11g"]="54M";
dic["11ng"]="150M";
dic["11ng2"]="300M";
dic["11ac"]="433M";
dic["wifi"]="Repeater";
dic["wwan"]="Modem";

var stations; //store the scanned stations
var repeater_ssid; //store the current repeater_ssid in repeater mode
var repeater_key;
var threeG_info; //store 3G service provider information
var current_country;
var current_sp;
var flag_network=0;
var flag_clients=0;
var flag_devices=0;
var flag_upnp=0;
var isIE=false;
var via_wifi=false;

if (!String.format) {
  String.format = function(format) {
	var args = Array.prototype.slice.call(arguments, 1);
	return format.replace(/{(\d+)}/g, function(match, number) {
	  return typeof args[number] != 'undefined'
		? args[number]
		: match
	  ;
	});
  };
}
/*Get Wan, Wifi, Lan, Port, Clients*/

function getNetworkStatus(){
	if(flag_network==1) return;
	flag_network=1;
	$.ajax({
		type : 'GET',
		dataType : 'json',
		url : "/cgi-bin/router_cgi",
		success : function(result){
			if(typeof result.success != 'undefined'){
				window.location="/html";
			}
			var wan;
			if(result.internet.wan && result.internet.wan.ipv4) wan=result.internet.wan;
			else if(result.internet.wwan && result.internet.wwan.ipv4) wan=result.internet.wwan;
			else if(result.internet.modem && result.internet.modem.ipv4) wan=result.internet.modem;
			else if(result.internet.tethering && result.internet.tethering.ipv4) wan=result.internet.tethering;
			$("#internet_ipaddr").text(wan?wan.ipv4.ipaddr:"");
			$("#internet_proto").text(wan?dic[wan.proto]:"");

			//set wifi status
			var wifis=result.wifi;
			for(var i=0;i<wifis.length;i++){
				wifi=wifis[i];
				if(i>=1 && !document.getElementById("div-wifi-"+i)){
					//make a new indicator, first check if has been clone
					var s=$("#div-wifi-0").clone().html();
					var s1="<div class='div_setting  hint--right' id='div-wifi-"+i+"'>"+s.replace(/-0/g,"-"+i)+"</div>";
					$("#div-wifi-"+(i-1)).after(s1);
					$("#div-wifi-"+i).click(function(){
						$("#div_main").load("/html/wifi_status")
					});
					$("#div-wifi-"+i).click(function(){
						if(mobile){
							$(".mobile-main").toggleClass("hidden");
							$("#div-main-holder").toggleClass("hidden");
						}

						$(".indicator").hide();
						$(".indicator1").hide();
						$(this).find(".indicator").show();
						$(".div_setting").removeClass("highlight");
						$(".div_app").removeClass("highlight");
						$(this).addClass("highlight");
					});
					$("#img-wifi-"+i).click(function(){
						popWifiSetting(i);
					});
				}
				$("#wifi_status-"+i).attr("data-ssid",wifi.ssid);
				$("#wifi_status-"+i).prop('checked',wifi.up);
				if(!wifi.up)
					$("#img-wifi-"+i).attr("src","/images/wifi0.png");
				else
					$("#img-wifi-"+i).attr("src","/images/wifi.png");
				$("#wifi_ssid-"+i).text(wifi.ssid);
				$("#wifi_mode-"+i).text(dic[wifi.mode]);
			}

			$("[id^='wifi_status']").change(function(e){
				e.stopPropagation();
				stopChecker();
				var status;
				if($(this).is(':checked'))
					status="Turn+On";
				else
					status="Turn+Off";
				var data="action=updatewifi&ssid="+$(this).data("ssid")+"&submit="+status ;
				$.ajax({
					type: "POST",
					url: "/cgi-bin/router_cgi",
					data: data,
					dataType: 'json',
					success: function(result){
						startChecker();
					},
					error:function(data,textStatus,jqXHR){
						startChecker();
					}
				});
			});

			//set port status
			var ddns=result.ddns;
			$("#port_value").text(ddns.service_port);
			flag_network=0;

			//set firmware version
			$("#div-firmware div .label_s2").text(result.version);
		}
	});
}
/*Get DHCP clients*/
function getClients(){
	if(flag_clients==1) return;
	flag_clients=1;
	$.ajax({
		type : 'GET',
		dataType : 'json',
		url : "/cgi-bin/router_cgi?action=getclients",
		success : function(result){
			$("#client_count").text(result.clients.length + " Devices");
			if(result.clients.length>0){
				var name=result.clients[0].name;
				$("#client_names").text(name.length<=16?name: name.substring(0,13)+"...");
			}
			flag_clients=0;
		}
	});
}
/*Check UPNP Status*/
function checkUpnp(){
	if(flag_upnp==1) return;
	flag_upnp=1;
	$.ajax({
		type : 'GET',
		dataType : 'json',
		url : "/cgi-bin/router_cgi?action=checkupnp",
		success : function(result){
			if(result.internet_exposure) {
				$("#port_status").text("Port Opened");
			}else{
				if(!result.ddns_enabled ) $("#port_status").text("WAN access disabled");
				else if(!result.upnp_open || !result.service_port_open ){
					$("#port_status").text("Port Not Opened");
				}else {
					$("#port_status").text("Port Opened");
				}
			}
			flag_upnp=0;
		}
	});
}


/*Get USB devices connected*/
var devices="";
function getDeviceStatus(){
	if(flag_devices==1) return;
	flag_devices=1;
	$.ajax({
		type : 'GET',
		dataType : 'json',
		url : "/cgi-bin/router_cgi?action=getdevices",
		success : function(result){
			if(JSON.stringify(result) == devices) {
				flag_devices=0;
				return;
			}
			devices=JSON.stringify(result);
			$("#div_devices .div_setting:gt(0)").remove();
			var disks=result.disks;
			var videos=result.videos;
			var i=0;
			var index=0;
			if(disks.length+videos.length==0){
				$("#device0 div .label_s1").text("No devices");
				$("#device0 div .available").hide();
				flag_devices=0;
				return;
			}
			var div_device;
			for(i=0, index=0;i<disks.length; i++, index++){
				if(index==0) {
					div_device=$("#device0");
				}else {
					div_device=$("#device0").clone();
					$("#div_devices").append(div_device);
					$(div_device).attr("id","device"+index);
				}
				var mount=disks[i].mount;
				var label=mount.split("/").pop();
				$(div_device).find(".available").show();
				$(div_device).find("div .label_s1").text(label + " (" + (disks[i].total/1024).toFixed(2) +"G)");
				if(disks[i].used > disks[i].total)
					$(div_device).find("div .available .usage").width("100%");
				else
					$(div_device).find("div .available .usage").width(disks[i].used/disks[i].total*100 +"%");
				$(div_device).attr("onclick", "javascript: checkContent('"+mount+"','div_main')");
				//$(div_device).click(function(){console.log(i); checkContent(disks[i].mount,"div_main")});
				if(mobile && index>0){
					$(div_device).click(function(e){
						$(".mobile-main").toggleClass("hidden");
						$("#div-main-holder").toggleClass("hidden");
					});
				}
				$(div_device).click(function(e){
					$(".indicator").hide();
					$(".indicator1").hide();
					$(this).find(".indicator").show();
					$(".div_setting").removeClass("highlight");
					$(".div_app").removeClass("highlight");
					$(this).addClass("highlight");
				});
			}
			for(i=0;i<videos.length; i++, index++){
				if(index==0){
					div_device=$("#device0");
				}else{
					div_device=$("#device0").clone();
					$(div_device).attr("id","device"+index);
					$("#div_devices").append(div_device);
				}
				$(div_device).find(".available").remove();
				$(div_device).find("div .label_s1").text(videos[i].model);
				var device=videos[i].device;
				$(div_device).click(function(e){
					display_video(device);
					if(mobile){
						$(".mobile-main").toggleClass("hidden");
						$("#div-main-holder").toggleClass("hidden");
					}
					$(".indicator").hide();
					$(".indicator1").hide();
					$(this).find(".indicator").show();
					$(".div_setting").removeClass("highlight");
					$(".div_app").removeClass("highlight");
					$(this).addClass("highlight");

					e.stopPropagation();
				});
			}
			flag_devices=0;
		}
	});
}


/*Translate all the html pages and refresh */
function translate_page(lang){
		$("#overlay").append("<div style='position:absolute;top:40%; width: 200px;left:45%;margin-top:-15px;margin-left:-100px;background-color:rgb(255,255,255);padding:10px;border-radius:5px;'><img src='/images/loading.gif'> <font color=red size=4>Translating...</font></div>");
		$("#overlay").show();
	$.ajax({
		type : 'GET',
		dataType : 'json',
		url : "/cgi-bin/login_cgi?action=translate&lang="+lang,
		success : function(result){
			if(result.success){
				window.location.reload(true);
			}else{
				alert("Error");
			}
		}
	});
}

/*Display a webcam live stream*/
function display_video(device){
	$.ajax({
		type : 'GET',
		dataType: 'json',
		url: "/cgi-bin/video_cgi",
		success: function(result){
			if(IE()){
				$("#div_main").html("<h1 class='bighint'>Sorry IE is not supported</h1><br><div class='center'>Please choose<a href='http://www.firefox.com'><img src='/images/firefox.png'></a>Or<a href='https://www.google.com/chrome/browser/'><img src='/images/chrome.png'></a></div>");
				return;
			}
			port=result.config.port;
			var source = "/stream";
			$("#div_main").html( "<div class='mainbar'></div><div style='text-align:center'><img width='80%' height='auto' style='border-radius:15px' src='"+source+"'></div>");
		}
	});
}

function check_login(){
	$.ajax({
		type : 'GET',
		dataType : 'json',
		url : "/cgi-bin/login_cgi?action=checklogin",
		async: false,
		success : function(result){
			if(result.via_wifi) via_wifi=true;
			if (!result.flash_ready){
				setTimeout(function(){ check_login();},5000);
			}else if (result.logged) {
			  window.location="/html/index";
			}else{
				$("#div-flash_ready").hide();
				$("#div-language").show();
				if(! result.code_entered){
					$("#div_code").show();
				}else{
					$("#div_code").hide();
				}
				if(result.language_set) {
					if(result.new_password){

					}else{
						window.location="/html/login";
					}
				}else{

				}
			}
		}
	});
}

/*List all the folder and files in path*/
function checkContent(path,div_id){
	if($("#storage_title").length==0){
		$("#"+div_id).html("<h2 id='storage_title'></h2><div id='storage_content'></div>");
	}
	//list hard drive
	if(path==null){
		$.ajax({
		type : 'GET',
		dataType: 'json',
		url: "/cgi-bin/storage_cgi?id=1",
		success: function(result){
			if(result.success){
				var html="";
				var drives=result.result;
				for (var i=0; i<drives.length; i++){
					var drive=drives[i].split(":");
					var template="<div><a href='javascript:checkContent(&quot;"+drive[5]+"&quot;,&quot;"+div_id+"&quot;)'><img src='/images/windows.png'><div> "+drive[5]+"</div><div>"+drive[3]+" Available, "+drive[1]+" Total</div> </a></div>";
					html += template;
				}
				if(drives.length>0){
					$("#storage_content").html(html);
					$("#storage_title").html("<a href='javascript:checkContent(null,&quot;"+div_id+"&quot;)'>/Storage</a>");
				}else{
					$("#storage_title").html("No storage device detected");
				}
			}else{
				window.location="/html/login";
			}
		}
		});
	}
	//list folder content
	else{
		$.ajax({
		type : 'GET',
		dataType: 'json',
		url: "/cgi-bin/storage_cgi?id=2&pwd="+path,
		success: function(result){
			if(result.success){
				var html="";
				var contents=result.result;
				//sort the result to show folder first
				contents.sort(function(a,b){
					a1=a.split("|");
					b1=b.split("|");
					if(a1[0]!=b1[0]){
						if(a1[0]=='-') return 1;
						else return -1;
					}else{
						return a1[3]>b1[3]?1:-1;
					}
				});
				//first examine path
				var folders=path.split("/");
				var full_path="";
				for (var i=0; i<folders.length; i++){
					var folder=folders[i];
					if(folder=="") continue;
					full_path += "/"+folder;
					if(folder=="mnt"){
						html += "<a href='javascript:checkContent(null,&quot;"+div_id+"&quot;)'>/Storage</a>";
					}else{
						if(folder.length>20) folder=folder.substring(0,17) +"...";
						if(full_path!=path)
							html += " > <a href='javascript:checkContent(\""+full_path+"\",&quot;"+div_id+"&quot;)'>"+folder+"</a>";
						else
							html += " > "+folder;
					}
				}
				$("#storage_title").html(html);

				html="<table>";
				for (var i=0; i<contents.length; i++){
					var file=contents[i].split("|");
					path=path.replace('"','\\"');
					file_name=file[3].replace('"','\\"');
					file_share_id=file[4];
					has_share="none";
					if(file_share_id.length>0) has_share="block";

					if(file[0]=='d'){
						folder_str="<tr><td><a href=\"javascript:checkContent(&quot;"+path+"/"+file_name+"&quot;,&quot;"+div_id+"&quot;)\"><image src='/images/folder.png'>"+file_name+"</a></td><td>-</td><td>"+file[2]+"</td><td width='20px'></td></tr>";
						html += folder_str;
					}else{
						file_str="<tr onmouseover='displaylink(this)' onmouseout='hidelink(this)'><td><a href=\"javascript:downloadContent(&quot;"+unescape(encodeURIComponent(path))+"/"+unescape(encodeURIComponent(file_name))+"&quot;)\"><image src='/images/file.png'>"+file_name+"</a><td>"+file[1]+"</td><td>"+file[2]+"</td><td width='20px'><a style='display:"+has_share+";cursor:pointer' onclick=\"showLinkInfo(&quot;"+path+"/"+file_name+"&quot;,this)\"><img src='/images/link.png'></a></td></tr>";
						html += file_str;
					}
				}
				html+="</table>"
				$("#storage_content").html(html);
			}else{
				window.location="/html/login";
			}
		}
		});
	}
}

/*The following functions display/hide link icon in main window and popup */

var file_has_link=0;
function displaylink(tr){
	if(tr.lastChild.firstChild.style.display=="block")
		file_has_link=1;
	else
		file_has_link=0;

	tr.lastChild.firstChild.style.display="block";
}
function hidelink(tr){
	if(file_has_link==0)
		tr.lastChild.firstChild.style.display="none";
}
var current_file;
var current_parent;
function showLinkInfo(file,a_parent){
	var area=$(a_parent).offset();
	$("#modal").css({top: area.top, left: area.left, width: $(a_parent).width(), height: $(a_parent).height()});
	$("#modal").show();

	setTimeout(function(){
		$("#modal").attr("class","modal open");
		$("#modal").removeAttr("style");
		$("#overlay").show();
	},20);
	$("#model_content").load("/html/share");
	current_file=file;
	current_parent=a_parent;
	//setTimeout(function(){fillLinkInfo(file,a_parent)},100);
}
/*This function fill the content of of file share popup*/
function fillLinkInfo(file,a_parent){
	$("#share_file_name").text(file);
	$.ajax({
		type : 'GET',
		dataType: 'json',
		url: "/cgi-bin/storage_cgi?id=6&file="+file,
		success: function(result){

			$("#file_share_link").text(result.url);
			if(result.url){
				$("#share_file_description").text("The file is shared as");
				$("#button_unlink").show();
				$("#button_link").hide();
			}
			else{
				$("#file_share_link").text("");
				$("#share_file_description").text("The file is not shared");
				$("#button_link").show();
				$("#button_unlink").hide();
			}
		}
	});

	//$("#button_link").unbind('click');
	$("#button_link").click(function linkContent(){
		$.ajax({
			type : 'GET',
			dataType: 'json',
			url: "/cgi-bin/storage_cgi?id=6&action=share&file="+file,
			success: function(result){
				if(result.url){
					$("#file_share_link").text(result.url);
					$("#share_file_description").text("The file is shared as");
					$("#button_unlink").show();
					$("#button_link").hide();
					a_parent.style.display="block";
				}
			}
		});
	});
	//$("#button_unlink").unbind('click');
	$("#button_unlink").click(function removeLink(){
		$.ajax({
			type : 'GET',
			dataType: 'json',
			url: "/cgi-bin/storage_cgi?id=6&action=remove&file="+file,
			success: function(result){
				if(result){
					$("#file_share_link").text("");
					$("#share_file_description").text("The file is not shared");
					$("#button_unlink").hide();
					$("#button_link").show();
					a_parent.style.display="none";
				}
			}
		});
	});
}

function remove_linkid(link){
	$.ajax({
		type : 'GET',
		dataType: 'json',
		url: "/cgi-bin/storage_cgi?id=8&linkid="+link,
		success: function(result){
			if(result){
				show_links();
			}
		}
	});
}

/*Download the content when click a file*/
function downloadContent(path){
	//$(".overlay-div").width($("html").width());
	//$(".overlay-div").height(getDocHeight());
	//$(".overlay-div").show();
	//$("#overlay-frame").attr("src","/cgi-bin/download_file?"+ escape(path));
	//$("#float_content").load("/cgi-bin/download_file?"+path);
	window.location="/cgi-bin/download_file?"+ escape(path);
}

/*Check Firmware version and newest firmware*/
function getFirmwareStatus(){
	$.ajax({
		type : 'GET',
		dataType : 'json',
		url : "/cgi-bin/firmware_cgi?action=checkversion",
		success : function(result){
			$("#div-firmware div .label_s2").text(result.version);
			if(result.has_new) $("#div-firmware .status_icon").show();
		}
	});
}

/*Show Wan setting popup*/
function popWanSetting(){
	repeater_only=false;
	var area=$("#div-internet").offset();
	$("#modal").css({top: area.top, left: area.left, width: $("#div-internet").width(), height: $("#div-internet").height()});
	$("#modal").show();

	setTimeout(function(){
		$("#model_content").hide();
		$("#modal").attr("class","modal open");
		$("#modal").removeAttr("style");
		$("#overlay").show();
	},20);
	setTimeout(function(){
		$("#model_content").show();
		$("#model_content").load("/html/wan_settings");
	},500);
}
/*Show Wifi popup*/
function popWifiSetting(i){
	var area=$("#div-wifi-0").offset();
	$("#modal").css({top: area.top, left: area.left, width: $("#div-wifi-0").width(), height: $("#div-wifi-0").height()});
	$("#model_content").load("/html/wifi_settings");
	$("#modal").show();

	setTimeout(function(){
		$("#modal").attr("class","modal open");
		$("#modal").removeAttr("style");
		$("#overlay").show();
	},20);

}

/*request a reboot, Shows the reboot window and process*/
function reboot(){
	$.ajax({
		type: "GET",
		url: "/cgi-bin/router_cgi?action=reset",
		dataType: 'json',
		timeout: 60000,
		success: function(result){
			show_reboot_progress('reboot');
		},
		error: function(){
			window.location.reload();
		}
	});
}

function logout(){
	if(typeof(window.localStorage) != 'undefined') localStorage.clear();
	window.location='/cgi-bin/login_cgi?action=logout';
}

function show_reboot_progress(title){
	if(title) $("#div-reboot-title").text(title);
	$("#div-reboot").attr("class","modal-reboot open");
	$("#overlay").show();
	$("#div-reboot").show();
	myTimer=setInterval(function(){detect_boot()},interval);
}

var myTimer;
var t=0;
var TotalTime=60000; // 1 minutes
var interval=2000;
var count=0;
function detect_boot(){
	count = count+1;
	t += 100 * interval/TotalTime;
	if(t>100) t=100;
	$("#div-reboot .progress-bar span").css("width",t+"%");
	$("#div-reboot .progress-bar span").text(Math.round(t) + "%");
	if(t>50 && count%5==0){
		$.ajax({
			type: "GET",
			url: "/html/login",
			dataType: 'html',
			success: function(result){
				window.location = "/html/login";
			}
		});
	}
	if(t>=100) window.location = "/html/login";
}
function IE() {
	 return ((navigator.appName == 'Microsoft Internet Explorer') || ((navigator.appName == 'Netscape') && (new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != null)));
}
if(IE()) isIE=true;
/*reArrange the tabs when click a tab*/
function arrangeTabs(id){
	$(".pop_main").css("min-height","250px");
	$(".modal.open").css("height","450px");
	if(id=="tab-1"){
		$("#tab-label-1").css("z-index",10);
		$("#tab-label-2").css("z-index",5);
		$("#tab-label-3").css("z-index",4);
		$("#tab-label-4").css("z-index",3);
		$("#tab-label-2").attr("class","label_right");
		$("#tab-label-3").attr("class","label_right");
		$("#tab-label-4").attr("class","label_right");
	}else if(id=="tab-2"){
		$("#tab-label-1").css("z-index",5);
		$("#tab-label-2").css("z-index",10);
		$("#tab-label-3").css("z-index",4);
		$("#tab-label-4").css("z-index",3);
		$("#tab-label-1").attr("class","label_left");
		$("#tab-label-3").attr("class","label_right");
		$("#tab-label-4").attr("class","label_right");
	}else if(id=="tab-3"){
		$(".modal.open").css("height","550px");
		$(".pop_main").css("min-height","360px");
		$("#tab-label-3").css("z-index",10);
		$("#tab-label-1").css("z-index",3);
		$("#tab-label-2").css("z-index",4);
		$("#tab-label-4").css("z-index",3);
		$("#tab-label-1").attr("class","label_left");
		$("#tab-label-2").attr("class","label_left");
		$("#tab-label-4").attr("class","label_right");
	}else if(id=="tab-4"){
		$("#tab-label-4").css("z-index",10);
		$("#tab-label-1").css("z-index",3);
		$("#tab-label-2").css("z-index",4);
		$("#tab-label-3").css("z-index",5);
		$("#tab-label-1").attr("class","label_left");
		$("#tab-label-2").attr("class","label_left");
		$("#tab-label-3").attr("class","label_left");
	}
}
/*fill wan settings when popup*/
function fill_wan_settings(){
	$.ajax({
		type : 'GET',
		dataType : 'json',
		url : "/cgi-bin/router_cgi?action=getwan",
		success : function(result){
			var proto;
			if(result.wan){
				proto=result.wan.proto;
				$("#wan-proto").val(result.wan.proto);
				if(result.wan.ipv4 && result.wan.ipv4.ipaddr){
					$("#wan-ipaddr").val(result.wan.ipv4.ipaddr);
					$("#wan-netmask").val(result.wan.ipv4.netmask);
					$("#wan-gateway").val(result.wan.ipv4.gateway);
					if(result.wan.ipv4.dns)	$("#wan-dns").val(result.wan.ipv4.dns[0]);
				}
				$("#wan-username").val(result.wan.username);
				$("#wan-password").val(result.wan.password);
			}
			if(result.wwan && result.wwan.ipv4 && result.wwan.ipv4.ipaddr){
				proto=result.wwan.proto;
				if(proto=="wds"){
					$("#wan-wds").val("wds");
					$("#wds-lan-ip").show();
					$("#wds-lan-ipaddr").val(result.wwan.ipv4.ipaddr);
				}else{
					$("input[name='wan-mode'][value='wifi']").prop("checked",true);
					$("#wan-ssid").append("<option>"+result.wwan.ssid+"</option>");
				}
				//$("#repeater-auto").prop('checked', result.wwan.auto);
			}
			if(result.modem && result.modem.ipv4 && result.modem.ipv4.ipaddr){
				proto="wwan";
			}
			if(result.tethering && result.tethering.ipv4 && result.tethering.ipv4.ipaddr){
				proto="tethering";
			}

			//this only navagator to the LAST available settings
			switch (proto) {
				case "pppoe":
				case "dhcp":
				case "static":
					$("input[name='wan-mode'][value='cable']").prop("checked",true);
					arrangeTabs("tab-1");
					wan_proto_change(proto);
					break;
				case "wds":
				case "wisp":
					arrangeTabs("tab-2");
					repeater_ssid=result.wwan.ssid;
					repeater_key=result.wwan.key;
					scanwifi();
					break;
				case "wwan":
					arrangeTabs("tab-3");
					$("input[name='wan-mode'][value='wwan']").prop("checked",true);
					fill_3g_info();
					break;
				case "phone":
					arrangeTabs("tab-4");
					$("input[name='wan-mode'][value='phone']").prop("checked",true);
					check_phone_connection();
					break;
				default:
					console.log(proto);
			}
		}
	});
}

function check_phone_connection(){
	$.ajax({
		type : 'GET',
		dataType : 'json',
		url : "/cgi-bin/router_cgi?action=getphone",
		success : function(result){
			$("#phone_device").empty();
			if(result.devices.length==0){
				$("#phone-msg").text("No phone device connected");
			}
			for(var i=0;i<result.devices.length;i++){
				var s="<option>"+ result.devices[i]+"</option>";
				$("#phone_device").append(s);
			}

		}
	});
}

/*switching between simple and advanced 3g settings */
function swtich_3g_mode_from(setting_mode){
	console.log(setting_mode);
	if(setting_mode=="simple"){
		$("#advanced-3g-toggle").attr("class","left");
		$("#advanced-3g-toggle").val("<<< Simple Setup");
		$("#div-3g-setup-manually").attr("class","show");
		$("#div-3g-setup-sp").attr("class","hidden");
		$("#3g-setting-mode").val("advanced");
		$("#3g-sp").prop("required",false);
	}else{
		$("#advanced-3g-toggle").attr("class","right");
		$("#advanced-3g-toggle").val("Advanced Setup >>>");
		$("#div-3g-setup-manually").attr("class","");
		$("#div-3g-setup-sp").attr("class","");
		$("#3g-setting-mode").val("simple");
		$("#3g-sp").prop("required",true);
	}
}

/*refresh 3g sp information, and fill settings with the first sp when change country*/
function refresh_3g_sp(){
	$("#3g-sp").empty();
	var country=$("#3g-country").val();
	if(country === "auto" ){
		$("#3g-apn").val();
		$("#3g-dialnum").val();
		$("#3g-username").val();
		$("#3g-password").val();
	}else{
		$("#3g-sp").show();
		var country_json=threeG_info[country];
		//console.log(country + "selected" + JSON.stringify(country_json));
		var sp_now=null;
		for(var isp in country_json){
			var isp_json=country_json[isp];
			if( isp.indexOf("isp")!== -1 ) {
				if( !sp_now) sp_now =isp_json;
				var isp_name=isp_json.isp_name;
				if(current_sp==isp){
					s="<option value='"+isp+"' selected>"+ isp_name+"</option>";
					sp_now=isp_json;
				}else{
					s="<option value='"+isp+"'>"+ isp_name+"</option>";
				}
				$("#3g-sp").append(s);
			}
		}
		$("#3g-apn").val(sp_now?sp_now.apn:"");
		//$("#3g-service").val(current_sp.service);
		$("#3g-dialnum").val(sp_now?sp_now.dial_num:"");
		$("#3g-username").val(sp_now?sp_now.username:"");
		$("#3g-password").val(sp_now?sp_now.password:"");
	}
}
/*When changing sp, fill the 3g settings*/
function refresh_3g_settings(){
	var country=$("#3g-country").val();
	var sp=$("#3g-sp").val();
	var sp_json=threeG_info[country][sp];
	$("#3g-apn").val(sp_json.apn);
	//$("#3g-service").val(sp.service);
	$("#3g-dialnum").val(sp_json.dial_num);
	$("#3g-username").val(sp_json.username);
	$("#3g-password").val(sp_json.password);
}

/*refresh  the 3g device information, if no 3g devices found, refresh every 4 seconds, releae the timer when shift from this page*/
var timer_3g_devices;
function refresh_3g_devices(){
	$("#3g-device").empty();
	$.ajax({
		type : 'GET',
		dataType : 'json',
		url : "/cgi-bin/router_cgi?action=3gsettings",
		async: false,
		success : function(result){
			devices=result.devices;
			if(devices && devices.length==0){
				timer_3g_devices=setTimeout(refresh_3g_devices,4000);
			}else{
				$("#3g-device-msg").text("");
				for(var i=0;i<devices.length;i++){
					device=devices[i];
					s="<option value='"+device+"'>"+ device+"</option>";
					$("#3g-device").append(s);
				}
			}
			if(result.config.device !=="")
				$("#3g-device").val(result.config.device);
			else
				$("#3g-device").val("/dev/ttyUSB2");
		}
	});
}

/*if setting is 3g, fill 3g information to UI*/
function fill_3g_info(){
	$("#3g-sp").empty();
	$("#3g-country").empty();
	$("#3g-device").empty();
	s="<option value='auto'>Please select region</option>";
	$("#3g-country").append(s);

	$.getJSON("/cgi-bin/router_cgi?action=3gsettings", function(result){
		devices=result.devices;

		if(devices && devices.length==0){
			$("#3g-simple-msg").text("Please plug in your modem");
			$(".modem").hide();
			t=setTimeout(refresh_3g_devices,4000);
		}else{
			$("#3g-simple-msg").text("");
			$(".modem").show();
			for(var i=0;i<devices.length;i++){
				device=devices[i];
				s="<option value='"+device+"'>"+ device+"</option>";
				$("#3g-device").append(s);
			}
		}

		current_country=result.config.country;
		current_sp=result.config.sp;
		//$("#3g-country").val(current_country);
		//$("#3g-sp").val(current_sp);
		$("#3g-apn").val(result.config.apn);
		$("#3g-dialnum").val(result.config.dialnum);
		$("#3g-pin").val(result.config.pincode);
		$("#3g-username").val(result.config.username);
		$("#3g-password").val(result.config.password);
		if(result.config.device !=="")
			$("#3g-device").val(result.config.device);
		else
			$("#3g-device").val("/dev/ttyUSB2");
		$("#3g-service").val(result.config.service);
	}).done( function(){
		$.getJSON("/cgi-bin/router_cgi?action=3ginfo", function(result){
			threeG_info=result;
			for (var k in result){
				var country=result[k];
				var country_name=country.country_name;
				var s;
				var s1;
				if(k==current_country){
					s="<option value='"+k+"' selected>"+ country_name+"</option>";
					for(var isp in country){
						if( isp.indexOf("isp")!== -1 ) {
							var isp_json=country[isp];
							var isp_name=isp.isp_name;
							if(current_sp==isp){
								s1="<option value='"+isp+"' selected>"+ isp_json.isp_name+"</option>";
							}else{
								s1="<option value='"+isp+"'>"+ isp_json.isp_name+"</option>";
							}
							$("#3g-sp").append(s1);
						}
					}
				}
				else{
					s="<option value='"+k+"'>"+ country_name+"</option>";
				}
				$("#3g-country").append(s);

			}
		});
	});

}


/*when using cable, switch between dhcp, pppoe, static*/
function wan_proto_change(proto){

	if(!proto)
		proto=$("#wan-proto")[0].value;
	$("#wan-username").parent().hide();
	$("#wan-password").parent().hide();
	$("#wan-ipaddr").parent().hide();
	$("#wan-netmask").parent().hide();
	$("#wan-gateway").parent().hide();
	$("#wan-dns").parent().hide();
	$("#wan-username").prop("required",false);
	$("#wan-password").prop("required",false);
	$("#wan-ipaddr").prop("required",false);
	$("#wan-netmask").prop("required",false);
	$("#wan-gateway").prop("required",false);
	$("#wan-dns").prop("required",false);
	if(proto=="pppoe"){
		$("#wan-username").parent().show();
		$("#wan-password").parent().show();
		$("#wan-username").prop("required",true);
		$("#wan-password").prop("required",true);
	}else if(proto=="static"){
		$("#wan-ipaddr").parent().show();
		$("#wan-netmask").parent().show();
		$("#wan-gateway").parent().show();
		$("#wan-dns").parent().show();
		$("#wan-ipaddr").prop("required",true);
		$("#wan-netmask").prop("required",true);
		$("#wan-gateway").prop("required",true);
		$("#wan-dns").prop("required",true);
	}else if(proto=="dhcp"){

	}
}

/*scan wifi and fill the select box*/
function scanwifi(){
	$("#wan-ssid-msg").html("<img src='/images/loading.gif' width='18px' height='18px'>");
	$("#wan-ssid").empty();
	$("#wan-ssid").msDropDown().data('dd').destroy();;
	$.ajax({
		type : 'GET',
		dataType : 'json',
		url : "/cgi-bin/router_cgi?action=scanwifi",
		success : function(result){
			$("#wan-ssid-msg").html("");
			stations=sortByKey(result.stations,"Quality");
			for(var i=0;i<stations.length;i++){
				var img;
				var has_password=true;
				if(stations[i].Encryption =="none") has_password=false;
				if(stations[i].Quality==100) img=(has_password?"/images/100e.png":"/images/100.png");
				else if(stations[i].Quality>=50) img=(has_password?"/images/75e.png":"/images/75.png");
				else if(stations[i].Quality>=25) img=(has_password?"/images/50e.png":"/images/50.png");
				else img=(has_password?"/images/25e.png":"/images/25.png");

				var s="<option data-image='"+img+"'>"+ stations[i].SSID+"</option>";
				$("#wan-ssid").append(s);
			}
			$("#wan-ssid").msDropDown();
			if(repeater_ssid){
				$("#wan-ssid").val(repeater_ssid);
				$("#wan-key").val(repeater_key);
				$("#wan-ssid").trigger("change");
			}else{
				//$("#wan-ssid").val(stations[0].ssid);
				$("#wan-encryption").val(stations[0].Encryption);
				$("#wan-channel").val(stations[0].Channel);
				$("#wan-mac").val(stations[0].MAC);
			}
		}
	});
}

function go_clone_mac(){
	$("#div-internet").trigger("click");
	setTimeout(function(){display_macclone();}, 200);
}

function close_modal(){
	$("#modal").attr("class","modal");
	//setTimeout($("#modal").hide(),1000);
	$("#overlay").hide();
}

/*sort array according to keys, used in sorting scanned wifi stations*/
function sortByKey(array, key) {
	return array.sort(function(a, b) {
		var x = a[key]; var y = b[key];
		return ((x < y) ? 1 : ((x > y) ? -1 : 0));
	});
}
function checkAvailability(){
	$.ajax({
		type : 'GET',
		dataType: 'json',
		url: "/cgi-bin/router_cgi?action=checkavailability",
		success: function(result){
			if(result.available){
				$("#internet-accessible").css("visibility","hidden");
			}else{
				$("#internet-accessible").css("visibility","visible");
			}
		}
	});
}
