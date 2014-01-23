function go() {

   //for (var j = 0; j <= 255; j++)
   //{
      //var tryip = "http://192.168.0." + j;
      var req = new XMLHttpRequest();
      //var tryip = "http://www.princeton.edu/main/";
      //var tryip = "54.197.241.92";
      var tryip = "http://www.google.com/";
//var tryip = "http://192.168.0.4";
      
      function newcallb() {
         var rs = req.readyState;
         if (rs > 1)
            console.log("googleback");
      }

      function handlereadychange(myip) { 
         console.log("HERE");
         console.log(myip);
         //document.write("My ip: " + myip + "\n<br>");
         //document.write("State changed.\n<br>");
         var rs = req.readyState;
         console.log("State is: " + rs);
         console.log(req);
         if (rs != 4) {
             return;
         }
         console.log("Done");
         if (req.status == 404) {
            console.log("404\n");
            return;
         }
         console.log("Probably a thing.");
          //document.write("Finding the IP address.\n<br>");
          //delete req['onreadystatechange'];
         /*var respo = req.responseText;
         var hostinfo = respo.split("http://");
         //document.write(hostinfo);
         var ip = "0.0.0.0";
         for (var i = 0; hostinfo.length >= i; i++) {
            var ipend = hostinfo[i].search("/wpad");
            if (ipend != -1)
            {
               ip = hostinfo[i].substring(0, ipend);
               break;
            }
         }
         if (ip == "0.0.0.0") {
            document.write("Error finding ip!\n<br>");
            return;
         }
         */
         //     document.write("IP found: " + ip + "\n<br>");
         var secondreq = new XMLHttpRequest();
         //document.write("Stuff\n<br>");
         try{
         secondreq.open("GET", "http://www.yahoo.com", true);
         secondreq.onreadystatechange = newcallb;
         secondreq.send();
         }
         catch(error)
         {
            document.write("google failed");
         }
//var postreq = new XMLHttpRequest();
         //postreq.open("POST", "http://" + ip + "/svc/xspctrl/disableTor", true);
         //postreq.send();

      }
      
      try {
         console.log("hi");
         req.open("GET", tryip, true);
         req.onreadystatechange = _.partial(handlereadychange, tryip);
         req.send();
         console.log('bye');
      }
      catch (error)
      {
         document.write("Site for " + tryip + " not found. \n<br>");
      } 
      //}
}

$(go);