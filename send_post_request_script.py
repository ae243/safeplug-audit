import httplib
import urllib

#params = urllib.urlencode({'@number': 12524, '@type': 'issue', '@action': 'show'})
headers = {"Content-type": "application/x-www-form-urlencoded",
            "Accept": "text/plain"}
conn = httplib.HTTPConnection("bugs.python.org") # put IP address here
#conn.request("POST", "", params, headers)
conn.request("POST", "", "", headers)
response = conn.getresponse()
data = response.read()
conn.close()
