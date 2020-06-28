TEAM_NAME="$1"
echo ""
FILE_NAME=found_by_team_$TEAM_NAME.txt
echo "" > found_by_team_$TEAM_NAME.txt

NOW_DATE=$(date +"%Y-%m-%d %T")
NOW_DATE_ONLY=$(date +"%Y-%m-%d")
NOW_DATE_FN=$(echo $NOW_DATE |  tr '[: ]' '_')
LINK_FOLDER=$(echo "$NOW_DATE_FN-$TEAM_NAME" |  tr -cd '[:alnum:]._-')

find . -name "*.yaml" -exec ./check_file_owner.sh "$TEAM_NAME" {} "$LINK_FOLDER" \; > found_by_team_$TEAM_NAME.txt

