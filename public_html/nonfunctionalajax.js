var complete = function(ip, jqXHR) {
   console.log("success");
   console.log(ip);
   console.log(jqXHR);
};

$(function() {
    var tryip = "http://54.197.241.93";
    // var tryip = "http://www.princeton.edu/main/";
    // var tryip = "hello.html";
    var req = $.ajax({
         type: "GET",
         crossDomain: true,
         url: tryip,
         timeout: 10000
    }).complete(_.partial(complete, tryip));

/*
    req.done(function(data, textStatus, jqXHR) {
       console.log('were here');
    }).error(function(a,b,c) {
       console.log('error');
       console.log(a);
       console.log(b);
       console.log(c);
    });
*/
    console.log("hi");
    console.log(req);
});