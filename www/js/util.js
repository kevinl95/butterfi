  //IE setInterval compitable
  function iesetInterval(){
    if (document.all && !window.setInterval.isPolyfill) {  
      var __nativeSI__ = window.setInterval;  
      window.setInterval = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {  
        var aArgs = Array.prototype.slice.call(arguments, 2);  
        return __nativeSI__(vCallback instanceof Function ? function () {  
          vCallback.apply(null, aArgs);  
        } : vCallback, nDelay);  
      };  
      window.setInterval.isPolyfill = true;  
    } 
  }
  
  function progress(percent, $element) {
    var progressBarWidth = percent * $element.width() / 100;  
    $element.find('div').animate({ width: progressBarWidth }, 500).html(percent + "%&nbsp;"); 
  }

  function inputHint(id,hint){
    var el = document.getElementById(id);
    this.hint = hint;
    this.el = el;
    this.el.style.color = '#aaa';
    this.el.value = hint;
    this.el.onfocus = function(){
        el.value = '';
        el.style.color = '';
    }
    this.el.onblur = function(){
        if (el.value == ''){
            el.style.color = '#aaa';
            el.value = hint;
        }else{
            el.onfocus = null;
            el.onblur = null;
        }
    }
  }
  
