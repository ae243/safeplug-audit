#!/bin/sh

#PATH=/sbin:/usr/sbin:/bin:/usr/bin

RETVAL=0

start()
{
    /bin/echo -n "Starting dropbear:           "

    if [ -e /var/dropbear.pid ]; then
        if [ -e /proc/$(cat /var/dropbear.pid) ]; then
            /bin/echo "Success (Already running)"
        else
            /bin/rm -f /var/dropbear.pid
            /usr/bin/nohup /usr/sbin/dropbear -P /var/dropbear.pid >&/dev/null &
            /bin/echo "Success (Stale pidfile)"
        fi
    else
        /usr/bin/nohup /usr/sbin/dropbear -P /var/dropbear.pid >&/dev/null &
        echo "Success"
    fi

    return $RETVAL;
}

stop() {
    /bin/echo -n "Stopping dropbear:           "

    if [ -e /var/dropbear.pid ]; then
        PID=$(cat /var/dropbear.pid)
        if [ -e /proc/$PID ]; then
            /bin/kill $PID
            # Wait a second for dropbear to die gracefully before SIGKILLing
            for count in 1 2 3 4 5; do
                if [ -e /proc/$PID ]; then
                    /bin/usleep 200000
                else
                    break
                fi
            done
            if [ -e /proc/$PID ]; then
                /bin/kill -KILL $PID
                /bin/rm -f /var/dropbear.pid
                /bin/echo "Success (Killed)"
            else
                /bin/echo "Success"
            fi
        else
            /bin/rm -f /var/dropbear.pid
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
