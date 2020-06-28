node src/registry.js index -c -r | tee execution.log
./find_errors_in_log.sh