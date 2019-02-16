import requests
from lxml import etree

import io
import json
from datetime import datetime
import subprocess

queries = [
    {
        "url": "https://www.wswhl.co.uk/public/clubresults.php",
        "post_data": {"Club_ID": "68"},
        "team_name_prefix": "M"
    },
    {
        "url": "https://www.wcwhl.co.uk/public/clubresults.php",
        "post_data": {"Club_ID": "73"},
        "team_name_prefix": "L"
    }
]

team_name_map = {
    "Old Bristolians": "1",
    "Old Bristolians A": "2",
    "Old Bristolians B": "3",
    "Old Bristolians C": "4",
    "Old Bristolians D": "5",
    "Old Bristolians E": "6",
    "Old Bristolians 2": "2",
    "Old Bristolians 3": "3",
    "Old Bristolians 4": "4",
    "Old Bristolians 5": "5",
    "Old Bristolians 6": "6",
}

timestamp = datetime.utcnow().strftime("%s")
subprocess.run("git reset HEAD 2018-2019", shell=True, check=True)
subprocess.run("git rm -rf 2018-2019", shell=True, check=True)
subprocess.run("rm -rf 2018-2019", shell=True, check=True)
subprocess.run("mkdir -p 2018-2019", shell=True, check=True)
subprocess.run("cp 2018-2019-data/*.js 2018-2019/", shell=True, check=True)
subprocess.run('sed "s/%TIMESTAMP%/{}/" < 2018-2019-data/index.html.in > 2018-2019/index.html'.format(timestamp), shell=True, check=True)

for query in queries:

    session = requests.session()
    r = requests.post(query["url"], data=query["post_data"])
    r.raise_for_status()

    results = {}

    htmlparser = etree.HTMLParser()
    tree = etree.parse(io.StringIO(r.text), htmlparser)
    for result in tree.xpath("//*[@id=\"wrapper\"]/div/div/div/table/tbody/tr"):
        components = result.findall("td")

        if len(components) != 10:
            continue

        home_team_score = components[5].text
        if home_team_score is None:
            continue

        home_team_name = components[4].text
        if "Old Bristolians" in home_team_name:
            obs_team_name = home_team_name
            obs_score = home_team_score
            opposition = components[9].text
            opposition_score = components[7].text
        else:
            obs_team_name = components[9].text

            if "Old Bristolians" not in obs_team_name:
                continue

            obs_score = components[7].text
            opposition = home_team_name
            opposition_score = home_team_score

        if obs_team_name not in results:
            results[obs_team_name] = []
        results[obs_team_name].append(
            {
                "opposition": opposition,
                "opposition_score": int(opposition_score),
                "obs_score": int(obs_score)
            }
        )

        if "Old Bristolians" in home_team_name and "Old Bristolians" in opposition:
            if opposition not in results:
                results[opposition] = []
            results[opposition].append(
                {
                    "opposition": home_team_name,
                    "opposition_score": int(obs_score),
                    "obs_score": int(opposition_score)
                }
            )

    for key in results:
        short_team_name = query["team_name_prefix"] + team_name_map[key]
        data_file_path = "2018-2019-data/{}.json".format(short_team_name)
        with open(data_file_path, "r") as f:
            data = json.load(f)

        for i, new_result in enumerate(results[key]):
            if i >= len(data):
                new_data = {}
                new_data.update(new_result)
                obs_score = new_data["obs_score"]
                del new_data["obs_score"]
                new_data["scorers"] = []
                if obs_score > 0:
                    new_data["scorers"].append({"name": "Unknown",
                                                "goals": obs_score})
                data.append(new_data)
            else:
                old_data = {}
                old_data.update(data[i])
                obs_score = 0
                for s in old_data["scorers"]:
                    obs_score += s["goals"]
                del old_data["scorers"]
                old_data["obs_score"] = obs_score

                if old_data != new_result:
                    print(short_team_name)
                    print("Existing: {}".format(old_data))
                    print("New:      {}".format(new_result))

        with open(data_file_path, "w") as f:
            json.dump(data, f, indent=4)

        for result in data:
            for scorer in result["scorers"]:
                if scorer["name"] == "Unknown":
                    print("{} unknown scorer: {}".format(short_team_name, result))

        published_file_path = "2018-2019/{}-{}.json".format(short_team_name, timestamp)
        subprocess.run('cp {} {}'.format(data_file_path, published_file_path),
                       shell=True, check=True)

subprocess.run('git add 2018-2019', shell=True, check=True)

