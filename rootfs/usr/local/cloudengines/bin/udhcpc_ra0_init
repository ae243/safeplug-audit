#!/bin/sh

#PATH=/sbin:/usr/sbin:/bin:/usr/bin
RA0=ra0
# TODO: Take interface from command line arg...

RETVAL=0

start()
{
    /bin/echo -n "Cycling '$RA0':   "

    # NB: udhcpc doesn't seem to update routing table when switching
    # NB: to a different wireless network!
    /sbin/ifconfig ra0 down
    if /sbin/ifconfig ra0 up; then
        /bin/echo "Success"
    else
        /bin/echo "Failure"
        /bin/echo "BUG: Flushing caches to defragment kernel DMA memory!"
        /bin/echo -n "Cycling '$RA0':   "
        /sbin/ifconfig ra0 down
        /bin/sync
        /bin/echo "1" > /proc/sys/vm/drop_caches
        if /sbin/ifconfig ra0 up; then
            /bin/echo "Success"
        else
            /bin/echo "Failure"
        fi
    fi

    /bin/echo -n "Starting udhcpc for '$RA0':   "

    if [ -e /var/udhcpc_$RA0.pid ]; then
        if [ -e /proc/$(/bin/cat /var/udhcpc_$RA0.pid) ]; then
            /bin/echo "Success (Already running)"
        else
            /bin/rm -f /var/udhcpc_$RA0.pid
            /sbin/udhcpc -i $RA0 -R -b -p /var/udhcpc_$RA0.pid >&/dev/null
            /bin/echo "Success (Stale pidfile)"
        fi
    else
        /sbin/udhcpc -i $RA0 -R -b -p /var/udhcpc_$RA0.pid >&/dev/null
        /bin/echo "Success"
    fi

    return $RETVAL;
}

stop() {
    /bin/echo -n "Stopping udhcpc for '$RA0':   "

    if [ -e /var/udhcpc_$RA0.pid ]; then
        PID=$(/bin/cat /var/udhcpc_$RA0.pid)
        if [ -e /proc/$PID ]; then
            /bin/kill $PID
            # Wait a second for udhcpc_$RA0 to die gracefully before SIGKILLing
            for count in 1 2 3 4 5; do
                if [ -e /proc/$PID ]; then
                    /bin/usleep 200000
                else
                    break
                fi
            done
            if [ -e /proc/$PID ]; then
                /bin/kill -KILL $PID
                /bin/rm -f /var/udhcpc_$RA0.pid
                /bin/echo "Success (Killed)"
            else
                /bin/echo "Success"
            fi
        else
            /bin/rm -f /var/udhcpc_$RA0.pid
            /bin/echo "Success (Stale pidfile)"
        fi
    else
        /bin/echo "Success (Not running)"
    fi

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
        /bin/echo "usage: $0 {start|stop|restart}"
        exit 1
        ;;
esac
