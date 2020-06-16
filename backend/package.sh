NOW_DATE=$(date +"%Y-%m-%d %T")
NOW_DATE_ONLY=$(date +"%Y-%m-%d")
NOW_DATE_FN=$(echo $NOW_DATE |  tr '[: ]' '_')
zip -r ../testsRegistry-${NOW_DATE_FN}.zip . --exclude='/node_modules/*'
