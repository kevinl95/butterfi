  var timer;
  var noAck;
  var task;
  
  function init(){
    task=new Array();
    timer=new Array();
    noAck=new Array();
  }
  
  Date.prototype.format = function(format)
  {
     var o = {
        "M+" : this.getMonth()+1, //month
        "d+" : this.getDate(),    //day
        "h+" : this.getHours(),   //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth()+3)/3),  //quarter
        "S" : this.getMilliseconds() //millisecond
     }
     if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
        (this.getFullYear()+"").substr(4 - RegExp.$1.length));
        for(var k in o)if(new RegExp("("+ k +")").test(format))
        format = format.replace(RegExp.$1,
        RegExp.$1.length==1 ? o[k] :
        ("00"+ o[k]).substr((""+ o[k]).length));
     return format;
  }
   
  function ajax_error(domain,req,st,err){
    if(window.console && console.log)
      console.log(domain+" ajax error "+req.readyState+" "+st+" "+err);
  }
   
  function add_task_event(id,name){
    $("#task-item-"+id).mouseover(function(){
      $("#task-item-"+id).css("background-color","#0064B4");
      $("#task-item-"+id).css("color","white");
    });
    
    $("#task-item-"+id).mouseout(function(){
      $("#task-item-"+id).css("background-color","#F2F2F2");
      $("#task-item-"+id).css("color","black");
    });
    
    $("#task-del-"+id).click(function(){
      remove_task(id);
    });
  }
  
  function add_task_list_item(id){
    var html=
    "<div class='task-item' id='task-item-"+id+"'>"+
    "  <div class='task-item-top' id='task-name-"+id+"'></div>"+
    "  <div class='task-item-center' id='task-item-center-"+id+"'>"+
    "     <div class='task-item-center-prog'>"+
    "       <div class='progressBar' id='task-prog-"+id+"' >"+
    "         <div></div>"+
    "       </div>"+
    "     </div>"+
    "     <input type='button' class='button' id='task-del-"+id+"' value='删除' /> "+
    "  </div>"+
    "  <div class='task-item-bottom'>"+      
    "     <span id='task-runtime-"+id+"'></span>"+  
    "  </div>"+
    "</div>"+
    "<div class='seperator3' id='seperator-"+id+"'></div>";

    if(window.console && console.log)
      console.log(html); 
    
    $("#task-list").append(html);
    
    add_task_event(id,"");
    
  }

  function complete_task(id){ 
    $("#task-item-center-"+id).remove();
    $("#task-name-"+id).css("margin-top","5px");
    $("#task-name-"+id).css("height","45%");
    $("#task-runtime-"+id).css("margin-bottom","5px");
    $("#task-runtime-"+id).css("height","45%");
    $("#task-item-"+id).css("height","56px");
    clearInterval(timer[id]);
    timer[id]=null;
    noAck[id]=null;
  }
  
  function add_task_ack(result){
    var args=result.split(":");
    if(args.length<2){
      
      return;
    }
   
    var id = args[0];
    var ret = args[1];    
 
    if(id < 0){
      
      return;
    }
   
    inputHint('input','支持HTTP/FTP/BT磁力链接方式下载，复制对应链接地址并粘贴在此处后点击下载按钮');
        
    add_task_list_item(id);
    
    if(timer[id]!=null)
      clearInterval(timer[id]);
    noAck[id]=1;
     
    timer[id]=setInterval(get_status_req,2000,id,1);
    
  }

  function remove_task_ack(result){
    
    var args=result.split(":");
    if(args.length<2){
      return;
    }
     
    var id = args[0];
    var ret = args[1];    
 
    if(ret<0){
      return;
    }
   
    $("#task-item-"+id).remove();
    $("#seperator-"+id).remove();    
        
    if(timer[id]!=null)
        clearInterval(timer[id]);
  }

  function get_status_ack(id,data){
    var tmp = data.split("\n");
    if(window.console && console.log)
      console.log(tmp);
    
    if(tmp.length>1){
       var main = tmp[0].split(";");
       var status = main[1];
       
       if(status==12){
         clearInterval(timer[id]);
         $("#task-runtime-"+id).text("下载出现错误，已停止!");
         return;
       }
       
       $("#task-name-"+id).text(main[2]);
       /* CLI_RECOGNIZEFILE  6*/
       if(status==6){
         clearInterval(timer[id]);
         timer[id]=setInterval(get_status_req,2000,id,0);
       }
       
       var connectInfo = tmp[1];
       $("#task-runtime-"+id).text(connectInfo);
       return;
    }

    //10:4:40:14MB/35MB(100%):500KiB:43s
    var params = data.replace(/i/g,"").split(";");
    if(window.console && console.log)
      console.log(params);
    
    if(params.length<6){
       noAck[id]=noAck[id]+1;
       if(noAck[id]>10){
         clearInterval(timer[id]);
       }
       return;
    }

    noAck[id]=1;
    var prog = params[2];
    if(prog != 100){
      //14MB/35MB(100%)
      var percent = params[3].split("(");
      var size = percent[0].split("/");
      $("#task-runtime-"+id).text(params[3]+"  "+params[4]+"  "+params[5]);
      if(!$("#task-runtime-"+id).attr("size")){
        $("#task-runtime-"+id).attr("size",size[1]);
      } 
       
      progress(prog, $("#task-prog-"+id));
    }
    else{
      var size=$("#task-runtime-"+id).attr("size");
      var dt = new Date().format("yyyy-MM-dd hh:mm:ss");
      var timestamp = size + "       " + dt;
      $("#task-runtime-"+id).text(timestamp);
      
      complete_task(id);
    }
  }

  function get_status_req(id,getMain){
    var request ={};
    if(getMain)
      request = "id=5&tkid="+id;
    else
      request = "id=6&tkid="+id;
    
    if(window.console && console.log)
      console.log("get_status task("+id+") "+request);
    
    jQuery.ajax({
       type:"GET",
       dataType:"json",
       url:"../cgi-bin/dl",
       timeout:15000,
       data:request,
       cache:false, 
       success:function(data){
          if(window.console && console.log)
            console.log("get_status_req response: "+data.success+" "+data.result);
          
          if(data.success){
            get_status_ack(id,data.result);
          }else{
            
          }
       },
       error:function(XMLHttpRequest,textStatus,errorThrown){
          if(window.console && console.log)
            console.log("Ajax error "+XMLHttpRequest.readyState+" "+textStatus+" "+errorThrown);
       }
    });
  }
  

  function remove_task(id){
    var name=$("#task-name-"+id).text();
    var request = "id=3&tkid="+id+"&file="+name;
    if(window.console && console.log)
      console.log("remove task("+id+") request: "+request);
    
    jQuery.ajax({
              type:"GET",
	      dataType:"json",
	      url:"../cgi-bin/dl",
	      data:request,
	      cache:false, 
              timeout:15000,
	      success:function(ret){
                if(window.console && console.log)
                  console.log("remove task("+id+") response: "+ret.success+" "+ret.result);
                remove_task_ack(ret.result);
              },
              error:function(XMLHttpRequest,textStatus,errorThrown){
                if(window.console && console.log)
                  console.log("Ajax error "+XMLHttpRequest.readyState+" "+textStatus+" "+errorThrown);
              }
	 });
  }
  
  
  function add_task_req(url){
      var request = "id=0&url="+escape(url);
      //var request = "id=0&url="+url;
      if(window.console && console.log)
        console.log("add task request: "+request);
      
      jQuery.ajax({
	      type:"GET",
	      dataType:'json',
              cache:false,
	      url:"../cgi-bin/dl",
	      data:request,
        timeout:15000,
	      success:function(ret){
                if(window.console && console.log)
                  console.log("add task response: "+ret.success+" "+ret.result);
                
                if(ret.success){
                  add_task_ack(ret.result);
                }else{
                }
              },
              error:function(XMLHttpRequest,textStatus,errorThrown){
                if(window.console && console.log)
                  console.log("Ajax error "+XMLHttpRequest.readyState+" "+textStatus+" "+errorThrown);
              }
	 });
  }
  
  /*发起*/
  function query_task(){
      var request = "id=4";
      if(window.console && console.log)
        console.log("query task request: "+request);
      
      jQuery.ajax({
	      type:"GET",
	      dataType:"json",
	      url:"../cgi-bin/dl",
	      data:request,
	      cache:false, 
              timeout:15000,
	      success:function(ret){
                if(window.console && console.log)
                  console.log("query_task response: "+ret.success+" "+ret.result);
                if(ret.success){
                  query_task_ack(ret.result);
                }else{
                }
              },
              error:function(XMLHttpRequest,textStatus,errorThrown){
                if(window.console && console.log)
                  console.log("Ajax error "+XMLHttpRequest.readyState+" "+textStatus+" "+errorThrown);
              }
	 });
  }
  
  function query_task_ack(ret){
      var tasks = ret.split(";");
      if(window.console && console.log)
        console.log("query task ack: "+tasks);
      for(var i=0;i<tasks.length;i++){
        var taskid = tasks[i].split(":");
        add_task_ack(tasks[i]);
      }
  }

  function restart(){
      var request = "id=7";
      if(window.console && console.log)
        console.log("restart request: "+request);
      
      jQuery.ajax({
	      type:"GET",
	      dataType:"json",
	      url:"../cgi-bin/dl",
	      data:request,
	      cache:false, 
              timeout:15000,
	      success:function(ret){
                $("#div_download_msg").html("<font color=red>重启服务成功.</font>");
              },
              error:function(XMLHttpRequest,textStatus,errorThrown){
                if(window.console && console.log)
                  console.log("Ajax error "+XMLHttpRequest.readyState+" "+textStatus+" "+errorThrown);
              }
	 });
  }
  
  
