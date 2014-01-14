var SFPG = new function() 
{
    var RPCPFX = '/svc/xspctrl/';
    var self      = this;
    var g_filters = [];
    
    
    var $ = this.$ = function(n) {
        if(typeof(n)=='string') {
            return document.getElementById(n);
        } else {
            return n;
        }
    };

    // rac (remove all children)
    //    remoaves all child nodes from the parent node (e)
    function rac(e, removeEl) {
        var el = $(e);
        if(el) {
            while(el.hasChildNodes()) {
                var c = el.firstChild;
                el.removeChild(c);
            }
            if(removeEl && el.parentNode)
                el.parentNode.removeChild(el);
        }
    };
    // dce (document create element)
    //     create element of type (t) optionally with id (i) and classname (c)
    function dce(t,i,c,ch) {
        var el = document.createElement(t);
        if(t=='a') el.href='#';
        if(i) el.id = i;
        if(c) el.className = c;
        if(ch) {
            if(ch.constructor == Array) {
                for(var i=0;i<ch.length;i++) {
                    if(ch[i]) {
                        el.appendChild(ch[i]);
                    }
                }
            } else {
                el.appendChild(ch);
            }
        }
        return el;
    };
    function dcd(c,ch,i) {
        var el = dce('div',i,c,ch);
        return el;
    }
    function dctn(t) {
        return document.createTextNode(t);
    };
    // --- class name helpers
    // lCN (list Class Names)
    //     returns an array of all class names on element (e)
    function lCN(e) {
        var cnl = [];
        var el = $(e);
        if(el) {
            if(el.className) {
                cnl = el.className.split(' ');
            }
        }
        return cnl;
    };
    // irCN (if remove Class Name)
    //      selectively removes class name (cn) from optional class name list (cnl) of element (e)
    function irCN(e, cn, cnl) {
        if(cnl === undefined || cnl === null) {
            cnl = lCN(e);
        }
        for(var i=0; i<cnl.length; i++) {
            if(cnl[i] == cn) {
                cnl.splice(i, 1);
                i--;
            }
        }
        return cnl;
    };
    // hCN (has Class Name)
    //     returns true if class name (cn) is on element (e), false otherwise
    function hCN(e, cn) {
        var r = false;
        var el = $(e);
        if(el) {
            var cnl = lCN(el, cn);
            for(var i=0; i<cnl.length; i++) {
                if(cnl[i] == cn) {
                    r = true;
                    break;
                }
            }
        }
        return r;
    };
    // aCN (add Class Name)
    //     adds the class name (cn) to element (e)
    var aCN = this.aCN = function(e, cn) {
        var el = $(e);
        if(el) {
            var cnl = irCN(el, cn);
            cnl[cnl.length] = cn;
            el.className = cnl.join(' ');
        }
    };
    // rCN (remove Class Name)
    //     removes the class name (cn) from element (e)
    var rCN = this.rCN = function(e, cn) {
        var el = $(e);
        if(el) {
            var cnl = irCN(el, cn);
            el.className = cnl.join(' ');
        }
    };
    // mCN (modify Class Name)
    //   adds or removes removes the class name (cn) from element (e)
    function mCN(e, cn, add) {
        if(add)
            aCN(e, cn);
        else
            rCN(e, cn);
    };
    // getByClass
    //     get an array of child elements that have the specified class
    function getByClass(parent, tag, cls) {
        var result = [];
        if(!parent) return result;
        var clses = (typeof(cls)==='string') ? [cls] : cls;
        var tgs   = (typeof(tag)==='string') ? [tag] : tag;
        for(var t = 0; t < tgs.length; ++t) {
            var all   = parent.getElementsByTagName(tgs[t]);
            for(var i = 0; i < all.length; ++i) {
                for(var j = 0; j < clses.length; ++j) {
                    if(hCN(all[i],clses[j])) {
                        result.push(all[i]);
                        break;
                    }
                }
            }
        }
        return result;
    };
    
    var rpc = this.rpc = function(hm, m, a, cb, d) {
        var wantErrors=false, noParse=false;
        if(a && a['want_errors']) {
            wantErrors = true;  // caller wants errors relayed in response, instead of being displayed to user
            delete a['want_errors'];
        }
        if(a && a['no_parse']) {
            noParse = true;     // caller does not want us to parse response but just return it as a string {resp_txt:RESPONSE}
            delete a['no_parse'];
        }
        
        var req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            var rs = 0;
            try {
                rs = req.readyState;
            } catch(e) {
                log('RPC Failure ('+m+'): '+e);
            }
            if(rs != 4) {
                return;
            }
            delete req['onreadystatechange'];
            var r;
            try {
                if(!noParse)
                    r = eval('('+req.responseText+')');
                else
                    r = {resp_txt: req.responseText||''};
            } catch(e) {
                log('RPC Parse Error('+m+'): '+e);
                r = {'ERR': 'RPC Parse Error('+m+'): '+e};
            }
            try {
                if(r && r['HB-EXCEPTION'])
                    r.ERR = r['HB-EXCEPTION'];
                if(r.ERR && !wantErrors) {
                    showWaiting(false);
                    showMsg(r.ERR);
                } else {
                    cb(r, d);
                }
            } catch(e) {
                log('RPC Callback Exception('+m+'): '+e);
            }
        }
    
        var u = RPCPFX + m;
        log('RPC('+m+') Sending To: '+u);
    
        if(hm != 'GET') {
            var p = '';
            if(a && a.req_body) {
                p = a.req_body;
            } else {
                p='<soapenv:Envelope><soapenv:Body><'+m+'>';
                var v=false;
                if(a) {
                    for(var k in a) {
                        if(k == 'valtoken') v=true;
                        p += '<'+k+'>';
                        var s = "" + a[k];
                        p += s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        s = null;
                        p += '</'+k+'>';
                        k = null;
                    }
                }
                p+='</'+m+'></soapenv:Body></soapenv:Envelope>';
            }
            req.open(hm, u, true);
            req.send(p);
        } else {
            req.open(hm, u, true);
            req.send();
        }
        p = null;
        return req;
    };

    
    function log(txt) {
        try {
            console.log(txt);
        } catch(e) {
        }
    }
    function showMsg(txt) {
        // TODO: Proper dialog
        alert(txt);
    }
    function showWaiting(on) {
        mCN($('sfpg_loading'), 'hidden', !on);
    }
    
    this.onFilterDomainKey = function(e) {
        e = e || window.event;
        if(e.keyCode == 13) // enter
            self.addFilterDomain();
    };
    this.addFilterDomain = function() {
        var domain = domainCheck = $('filterinp').value.toLowerCase();
        if(g_filters.indexOf(domain) != -1) {
            $('filterinp').value = '';
            return; // already added
        }
        // Validate that this domain; allow it to optionally begin with "." for wildcard
        if(domainCheck.substr(0,1) == '.')
            domainCheck = domainCheck.substr(1);
        if(!/^(?:[a-zA-Z0-9]+(?:\-*[a-zA-Z0-9])*\.)+[a-zA-Z]{2,6}$/.test(domainCheck)) {
            showMsg('Please specify a valid domain. You may optionally start with a dot to support several sub-domains, for example ".domain.com" .');
            return;
        }
        // Actually apply
        showWaiting(true);
        g_filters.push(domain);
        applyFilterList(function() {
            showWaiting(false);
            appendFilterList(domain);
            $('filterinp').value = '';
        });
    };
    function appendFilterList(domain) {
        var itm = $('filterlst').appendChild(dcd('itm',dctn(domain)));
        itm.onclick = function() {
            var selItms = getByClass($('filterlst'), 'div', 'selected');
            for(var i = selItms.length-1; i >= 0; --i)
                rCN(selItms[i], 'selected');
            aCN(itm, 'selected');
            rCN('removebut', 'disabled');
            
            $('removebut').onclick = function() {
                // Apply
                var i = g_filters.indexOf(domain);
                if(i != -1)
                    g_filters.splice(i, 1);
                showWaiting(true);
                applyFilterList(function() {
                    showWaiting(false);
                    rac(itm, true);
                    aCN('removebut', 'disabled');
                });
            };
        };
    }
    function applyFilterList(cbDone) {
        rpc('POST', 'setTorExceptions', {req_body:g_filters.join(','), no_parse:true},
        function(r) {
            if(cbDone)
                cbDone();
        });
    }
    
    this.toggleTor = function() {
        showWaiting(true);
        var doEnable = !hCN('switch_tor','on');
        rpc('POST', doEnable?'enableTor':'disableTor', {},
        function(r) {
            updateStatus();
        });
    };
    this.toggleAdblock = function() {
        showWaiting(true);
        var doEnable = !hCN('switch_adblock','on');
        rpc('POST', doEnable?'enableAdBlock':'disableAdBlock', {},
        function(r) {
            updateStatus();
        });
    };
    this.toggleTorRelay = function() {
        showWaiting(true);
        var doEnable = !hCN('switch_relay','on');
        rpc('POST', doEnable?'enableTorRelay':'disableTorRelay', {},
        function(r) {
            updateStatus();
        });
    };
    this.toggleExits = function() {
        showWaiting(true);
        var doEnable = !hCN('switch_exits','on');
        rpc('POST', doEnable?'enableTorExitRelay':'disableTorExitRelay', {},
        function(r) {
            updateStatus();
        });
    };
    
    this.clickTab = function(tab) {
        mCN('tab_plug',         'selected', (tab=='plug'));
        mCN('tab_browser',      'selected', (tab=='browser'));
        mCN('settings_plug',    'hidden',   (tab!='plug'));
        mCN('settings_browser', 'hidden',   (tab!='browser'));
    };
    
    this.checkForUpdate = function() {
        showWaiting(true);
        rpc('POST', 'checkUpgrade', {},
        function(r) {
            if(!r || r.upgrading != 1)
                return showWaiting(false);  // nothing
            
            // Upgrading
            function checkUpg() {
                rpc('GET', 'getStatus', {want_errors:true},
                function(r) {
                    if(r.ERR) {
                        setTimeout(checkUpg, 5000); // give it some time to come back
                    } else if(r.upgrading != '1') {
                        updateStatus(function() {
                            showWaiting(false);     // done!
                        });
                    } else {
                        setTimeout(checkUpg, 500);  // still upgrading
                    }
                });
            }
            checkUpg();
        });
    };
    
    this.createBookmark = function() {
        //http://stackoverflow.com/questions/10033215/add-to-favorites-button
        if (window.sidebar && window.sidebar.addPanel) { // Mozilla Firefox Bookmark
            window.sidebar.addPanel(document.title,window.location.href,'');
        } else if(window.external && ('AddFavorite' in window.external)) { // IE Favorite
            window.external.AddFavorite(location.href,document.title); 
        } else if(window.opera && window.print) { // Opera Hotlist
            this.title=document.title;
            return true;
        } else { // webkit - safari/chrome
            showMsg('Press ' + (navigator.userAgent.toLowerCase().indexOf('mac') != - 1 ? 'Command/Cmd' : 'CTRL') + ' + D to bookmark this page.');
        }
    };
    this.closeBookPrompt = function() {
        mCN('bookmarkprompt', 'hidden', true);
    };
    
    function updateStatus(cbDone) {
        showWaiting(true);
        // Get status
        rpc('GET', 'getStatus', {},
        function(r) {
            mCN('switch_tor',       'on',    !!r.tor);
            mCN('switch_adblock',   'on',    !!r.adblock);
            mCN('switch_relay',     'on',    !!r.torrelay);
            mCN('relay_subopts',    'hidden', !r.torrelay);
            mCN('switch_exits',     'on',    !!r.torexitrelay);
            
            rac('sfpgver');
            $('sfpgver').appendChild(dctn(r.version));
            
            showWaiting(false);
            if(cbDone)
                cbDone();
        });
    }
    
    this.init = function() {
        $('portip').appendChild(dctn(window.location.host));
        updateStatus(function() {
            rpc('POST', 'getTorExceptions', {no_parse:true},
            function(r) {
                if(r.resp_txt && r.resp_txt.indexOf('\n') != -1)
                    r.resp_txt = r.resp_txt.substr(0,r.resp_txt.indexOf('\n'));
                g_filters = r.resp_txt ? r.resp_txt.split(',') : [];
                for(var i = 0; i < g_filters.length; ++i)
                    appendFilterList(g_filters[i]);
                
                if(window.location.hash && window.location.hash.indexOf('bookmark')) {
                    window.location.hash = '';
                    $('addr').appendChild(dctn('http://'+window.location.host));
                    mCN('bookmarkprompt', 'hidden', false);
                    $('bookmarkprompt_dlg').style.marginTop = '-' + ($('bookmarkprompt_dlg').offsetHeight/2) + 'px';
                }
            });
        });
    };
};
