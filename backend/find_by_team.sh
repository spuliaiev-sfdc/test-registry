TEAM_NAME="$1"
yq r file.yaml classInfo.owners["$TEAM_NAME"]
