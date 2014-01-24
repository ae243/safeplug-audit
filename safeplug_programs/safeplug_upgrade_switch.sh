#!/bin/sh

UHOST=upgrade.pogoplug.com

LIGHTTPD_MD5=0fb7c71e610e6e7a478c2324d38ac99f
LIGHTTPD_CONFIG_MD5=0a5c18ff7445358e17c44118e551f78a
GOHELPER_MD5=8831628bfee28c50d1866b60f0dd8063
WGET_MD5=d7251ba324f566a10717d7e1e06190e1
CERTS_MD5=39d333e31c7eb6b55cba1dbefeb0abd2
TOR_MD5=8ccd99119b4d99a6296ea91585d2179f
TOR_CONFIG_MD5=f9526c0ffb7f8654bc3f5ec240eee621
PRIVOXY_MD5=446439df7498fed1484251c5bfac3f6a
PRIVOXY_CONFIG_MD5=1233a1e7f31a050eb5c4e3187e8c6bac

exec >& /tmp/upgrade_switch.log

killandwait() {
    killall $1
    # Wait for $1 to quit gracefully before forcing it
    if pidof $1 > /dev/null; then
        retries=$2
        while pidof $1 > /dev/null && [ $retries -gt 0 ]; do
            sleep 1
            let retries--
        done
        if pidof $1 > /dev/null; then
            killall -9 $1
        fi
    fi
}

doinstall() {
    echo "Downloading $1..."
    rm -f $2
    if ! wget http://$UHOST/svc/upgrade/$2; then
        echo "Download $1 Failed!"
        echo "led0=0" > /dev/xce
        rm -f /tmp/sp_upgrade
        exit 1
    fi
    dlmd5=`md5sum $2 | sed 's/ .*//'`
    if [ x$3 != x$dlmd5 ]; then
        echo "Download $1 Failed!  MD5 Incorrect: $dlmd5!"
        echo "led0=0" > /dev/xce
        rm -f /tmp/sp_upgrade
        exit 1
    fi
    echo "Download $1 complete (MD5: $dlmd5)"
    rm -f state/$1
    if tar xzf $2; then
        rm -f $2
        mkdir -p state
        echo "$dlmd5" > state/$1
        sync
        echo "$1 installed successfully"
    else
        rm -f $2
        echo "Install $1 Failed!  MD5 Incorrect: $dlmd5!"
        echo "led0=0" > /dev/xce
        rm -f /tmp/sp_upgrade
        sync
        exit 1
    fi
}

echo "led0=blink" > /dev/xce
touch /tmp/sp_upgrade

if [ -d /opt/xce ]; then
    echo "We need to upgrade a prior safeplug install..."
    /opt/xce/etc/init.d/lighttpd stop
    /opt/xce/etc/init.d/privoxy stop
    /opt/xce/etc/init.d/tor stop
    sleep 1
fi

# These are the core cleanup bits we always need to do...
mount / -o remount,rw
mkdir -p /opt/xce
cd /opt/xce

if ! grep nobody /etc/group > /dev/null; then
    echo "Creating 'nobody' group..."
    echo 'nobody:x:499:nobody' >> /etc/group
fi
if ! grep nobody /etc/passwd > /dev/null; then
    echo "Creating 'nobody' user..."
    echo 'nobody:x:499:499:nobody:/tmp:/bin/false' >> /etc/passwd
fi
if ! grep privoxy /etc/group > /dev/null; then
    echo "Creating 'privoxy' group..."
    echo 'privoxy:x:498:privoxy' >> /etc/group
fi
if ! grep privoxy /etc/passwd > /dev/null; then
    echo "Creating 'privoxy' user..."
    echo 'privoxy:x:498:498:privoxy:/tmp:/bin/false' >> /etc/passwd
fi
if ! grep tor /etc/group > /dev/null; then
    echo "Creating 'tor' group..."
    echo 'tor:x:497:tor' >> /etc/group
fi
if ! grep tor /etc/passwd > /dev/null; then
    echo "Creating 'tor' user..."
    echo 'tor:x:497:497:tor:/tmp:/bin/false' >> /etc/passwd
fi

doinstall lighttpd safeplug_lighttpd.tgz $LIGHTTPD_MD5
doinstall lighttpd_config safeplug_lighttpd_config.tgz $LIGHTTPD_CONFIG_MD5

echo "Switching from hbplug to lighthttpd (early so UI can notice)..."
killall -9 hbwd
killandwait hbplug 10

/opt/xce/etc/init.d/lighttpd start

doinstall wget safeplug_wget.tgz $WGET_MD5
doinstall certs safeplug_certs.tgz $CERTS_MD5
rm -f /usr/local/ssl
ln -s /opt/xce/ssl /usr/local/ssl

doinstall gohelper safeplug_gohelper.tgz $GOHELPER_MD5
chmod ug+s /opt/xce/sbin/go_helper 
chmod a+r /dev/mtd0

doinstall tor safeplug_tor.tgz $TOR_MD5
doinstall tor_config safeplug_tor_config.tgz $TOR_CONFIG_MD5

doinstall privoxy safeplug_privoxy.tgz $PRIVOXY_MD5
doinstall privoxy_config safeplug_privoxy_config.tgz $PRIVOXY_CONFIG_MD5

if [ ! -f /opt/xce/etc/sp.conf ]; then
    echo "Setting default configuration..."
    echo "sp_tor=1" > /opt/xce/etc/sp.conf
    echo "sp_relay=0" >> /opt/xce/etc/sp.conf
    echo "sp_exitrelay=0" >> /opt/xce/etc/sp.conf
    echo "sp_adblock=0" >> /opt/xce/etc/sp.conf
fi

echo "sp_version=1.0" > /opt/xce/etc/sp_version

/opt/xce/etc/init.d/tor start
/opt/xce/etc/init.d/privoxy start

hostname Safeplug
cat /etc/init.d/rcS | sed -e 's/PogoplugMobile/Safeplug/' | grep -v '/etc/init.d/hbmgr.sh' | grep -v '/opt/xce/etc/init.d' > /etc/init.d/rcS.new
echo '/opt/xce/etc/init.d/lighttpd start' >> /etc/init.d/rcS.new

echo '' >> /etc/init.d/rcS.new
echo 'insmod /usr/local/cloudengines/bin/xce.ko' >> /etc/init.d/rcS.new
echo '/opt/xce/sbin/ntpdate' >> /etc/init.d/rcS.new
echo 'echo "led0=1" > /dev/xce' >> /etc/init.d/rcS.new
echo '' >> /etc/init.d/rcS.new

echo '/opt/xce/etc/init.d/tor start' >> /etc/init.d/rcS.new
echo '/opt/xce/etc/init.d/privoxy start' >> /etc/init.d/rcS.new
chmod +x /etc/init.d/rcS.new
if [ ! -f /etc/init.d/rcS.old ]; then
    mv /etc/init.d/rcS /etc/init.d/rcS.old
fi
mv /etc/init.d/rcS.new /etc/init.d/rcS

rm -f /tmp/sp_upgrade
echo "led0=1" > /dev/xce
rm -f /tmp/hbupg

echo "Upgrade complete"
