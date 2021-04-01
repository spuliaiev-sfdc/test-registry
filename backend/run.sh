NOW_DATE=$(date +"%Y-%m-%d %T")
NOW_DATE_ONLY=$(date +"%Y-%m-%d")
NOW_DATE_FN=$(echo $NOW_DATE |  tr '[: ]' '_')
LINK_FOLDER=$(echo "$NOW_DATE_FN" |  tr -cd '[:alnum:]._-')

mkdir -p ./data-${NOW_DATE_FN}
node src/registry.js index -c -r -d ./data-${NOW_DATE_FN} -o ./data-${NOW_DATE_FN}  | tee ./data-${NOW_DATE_FN}/execution.log
#./find_errors_in_log.sh
#./find_by_team.sh 'Accounts'