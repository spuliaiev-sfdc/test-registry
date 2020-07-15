node src/registry.js index -c | tee execution.log
./find_errors_in_log.sh
./find_by_team.sh 'Accounts'