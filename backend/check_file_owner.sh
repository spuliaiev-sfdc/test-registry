TEAM_NAME=$1
file=$2
CREATE_LINKS=$3
mkdir -p $CREATE_LINKS
echo "Testing $file" >&2
if [[ $(yq r $file classInfo.owners["$TEAM_NAME"] -l ) ]]; then 
	echo "  Owner" >&2
    echo "$2"
	echo $file >>found_by_team_.txt
    if [[ "$CREATE_LINKS" != "" ]]; then
        ln -s ../$file "$CREATE_LINKS"
    fi
else 
    if [[ $(yq r $file classInfo.ownersPartial["$TEAM_NAME"] -l ) ]]; then 
        echo "  Owner partial" >&2
        echo "$2"
		echo $file >>found_by_team_.txt
        if [[ "$CREATE_LINKS" != "" ]]; then
            ln -s ../$file "$CREATE_LINKS"
        fi
	fi
fi
