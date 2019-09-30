import subprocess
from datetime import datetime

timestamp = datetime.utcnow().strftime("%s")
subprocess.run("git reset HEAD 2019-2020", shell=True, check=True)
subprocess.run("git rm -rf 2019-2020", shell=True, check=True)
subprocess.run("rm -rf 2019-2020", shell=True, check=True)
subprocess.run("mkdir -p 2019-2020", shell=True, check=True)
subprocess.run("cp 2019-2020-data/*.js 2019-2020/", shell=True, check=True)
subprocess.run("cp 2019-2020-data/data.json 2019-2020/data-{}.json".format(timestamp), shell=True, check=True)
subprocess.run('sed "s/%TIMESTAMP%/{}/" < 2019-2020-data/index.html.in > 2019-2020/index.html'.format(timestamp), shell=True, check=True)
subprocess.run('git add 2019-2020', shell=True, check=True)