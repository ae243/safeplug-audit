#!/bin/sh

INSTDIR=/usr/local/cloudengines
RETVAL=0

start()
{
    cd $INSTDIR

    modprobe vfat

    if [ -f $INSTDIR/bin/ufsd.ko ]; then
        insmod $INSTDIR/bin/ufsd.ko
    fi

    if [ -f $INSTDIR/bin/rt3070sta.ko ]; then
        echo -n "Loading rt3070sta.ko:        "

        if insmod $INSTDIR/bin/rt3070sta.ko; then
            echo "Success"
        else
            echo "Failure"
        fi
    fi

    echo -n "Loading xce.ko:              "
    if [ -f $INSTDIR/bin/xce.ko ]; then
        insmod $INSTDIR/bin/xce.ko
    else
        modprobe xce
    fi
    if [ $? ]; then
        echo "Success"
        if [ ! -e /dev/xce ]; then 
            mknod /dev/xce c 10 241
        fi
    else
        echo "Failure"
    fi

    # Make sure watchdog is off...
    echo "wdog=off" > /dev/xce

    echo -n "Starting hbplug:             "
    ulimit -n 65536
    ulimit -c unlimited
    nohup $INSTDIR/bin/hbwd $INSTDIR/bin/hbplug > /dev/null 2>&1 &
    echo "Success"

    return $RETVAL
}

stop() {
    echo -n "Shutting down hbplug:        "
    if pidof hbwd > /dev/null; then
        killall hbwd > /dev/null 2>&1
        retries=120
        while pidof hbwd > /dev/null && [ $retries -gt 0 ]; do
            sleep 1;
            let retries--
        done
        if [ $retries -eq 0 ]; then
            echo "Failure"
        else
            echo "Success"
        fi
        killall -9 ffmpeg
    else
        echo "Not Running"
    fi

    if [ -f $INSTDIR/bin/ufsd.ko ]; then
        rmmod ufsd
    fi

    if [ -f $INSTDIR/bin/rt3070sta.ko ]; then
        echo -n "Unloading rt3070sta.ko:      "

        rmmod rt3070sta

        if [ $? ]; then
            echo "Success"
        else
            echo "Failure"
        fi
    fi

    # Make sure watchdog is off...
    echo "wdog=off" > /dev/xce

    echo -n "Unloading xce.ko:            "
    if [ -f $INSTDIR/bin/xce.ko ]; then
        if rmmod xce > /dev/null 2>&1; then
            echo "Success"
        else
            echo "Failure"
        fi
    else
        modprobe -r xce
        echo "Success"
    fi

    modprobe -r vfat

    return $RETVAL
}

restart() {
    stop
    start
}

#
# Usage statement.
#

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    *)
        echo "usage: $0 {start|stop|restart}"
        exit 1
        ;;
esac
