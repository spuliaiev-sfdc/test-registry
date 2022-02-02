"""
    Scanner for fTestInventory

Usage:
  ftest_inventory_scanner.py [PATH] [-v] [-d DATABASE]

Options:
  PATH              Path to workspace-user.xml
  -d DATABASE       Output the result into provided database, Default: ftests_inventory
  -v                Verbose logging
"""

import os
from pathlib import Path
from pyexpat import ExpatError
from xml.dom import minidom

import psycopg2
from psycopg2.extras import Json

DATABASE_CONFIG = {
    "database": "ftests_inventory",
    "user": "admin",
    "password": "admin",
    "host": "localhost",
    "port": 5432,
}

active_connection = None
verbose_log = False


def verbose(message: str):
    if verbose_log:
        print(f'*** TRACE: {message}')


def get_connection():
    global active_connection
    # RETURN THE CONNECTION OBJECT
    if active_connection:
        return active_connection
    active_connection = psycopg2.connect(
        database=DATABASE_CONFIG.get('database'),
        user=DATABASE_CONFIG.get('user'),
        password=DATABASE_CONFIG.get('password'),
        host=DATABASE_CONFIG.get('host'),
        port=DATABASE_CONFIG.get('port'),
    )
    return active_connection


def prepare_database():
    """
    create database ftests_inventory
    """
    pass


def attempt_insert(conn):
    # CREATE A CURSOR USING THE CONNECTION OBJECT
    curr = conn.cursor()

    dict_obj = [{"name": "testGetLatestDocument", "owners": [], "labels": []},
                {"name": "testPushDocumentSuccess", "owners": [], "labels": []},
                {"name": "testPushDocumentRetryLater", "owners": [], "labels": []},
                {"name": "testPushDocumentConflict", "owners": [], "labels": []},
                {"name": "testPushDocumentPreconditionFailed", "owners": [], "labels": []}]

    # EXECUTE THE INSERT QUERY
    curr.execute(f'''
        INSERT INTO
            tests.tests(class_name, methods) 
        VALUES
            ('JSON002', {Json(dict_obj)})
    ''')

    # COMMIT THE REQUESTS IN QUEUE
    conn.commit()


def clean_previous_scans(conn, current_scan_id):
    """
    Cleans the rows for previous scans
    :param conn: Connection
    :param current_scan_id: Current scan_id
    :return: number of rows removed
    """
    print(f'*** INFO: cleaning previous scans < {current_scan_id} ...')
    # CREATE A CURSOR USING THE CONNECTION OBJECT
    curr = conn.cursor()
    # EXECUTE THE DELETE QUERY
    curr.execute(f'DELETE FROM tests.xml_inventory  WHERE scan_id < %s', (current_scan_id,))
    # COMMIT THE REQUESTS IN QUEUE
    conn.commit()
    print(f'*** INFO: cleaning previous scans < {current_scan_id} Removed: {curr.rowcount}')

    return curr.rowcount


def find_new_scan_id(conn):
    # CREATE A CURSOR USING THE CONNECTION OBJECT
    curr = conn.cursor()

    # EXECUTE THE SELECT QUERY
    curr.execute(f'SELECT COALESCE(max(scan_id),0) from tests.xml_inventory')
    records = curr.fetchall()

    next_id = records[0][0] + 1 if len(records) > 0 else 0

    # CLOSE THE CURSOR
    curr.close()

    return next_id


def insert_xml_inventory(conn, scan_id: int, module: str, file_name: str,
                         category_full_name: str, class_name: str,
                         scrum_team: str, owner: str):
    # CREATE A CURSOR USING THE CONNECTION OBJECT
    curr = conn.cursor()

    try:
        # EXECUTE THE INSERT QUERY
        curr.execute(f'''
            INSERT INTO
                tests.xml_inventory(class_name, module, file_path, owner, 
                                    scrum_team, category, scan_id) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (class_name, module, file_name, owner, scrum_team,
              category_full_name, scan_id))

        # COMMIT THE REQUESTS IN QUEUE
        conn.commit()
    except Exception as e:
        print(f'*** ERROR: Failed to insert xml_inventory row with error {e} for:\n'
              f'module    : {module} \n'
              f'file_path : {file_name} \n'
              f'class_name: {class_name} \n'
              f'category  : {category_full_name} \n'
              f'owner     : {owner} \n'
              f'scrum_team: {scrum_team}'
              )

    return curr.rowcount


def leading_spaces(string: str):
    return string[:-len(string.lstrip())]


def print_xml_error(xml_lines, lineno, offset):
    line_index = max(0, lineno - 3)
    for line in xml_lines[line_index:min(lineno + 3, len(xml_lines))]:
        line_index += 1
        # Do some masking - like username and password
        masked_fields = ['username', 'password']
        has_masked = next(
            (masked_field for masked_field in masked_fields if masked_field in line), None)
        if has_masked:
            line = f'{leading_spaces(line)}<{has_masked}>****</{has_masked}>'
        print(f"{line_index:4}: {line}")
        if line_index == lineno:
            print('     ' + ' ' * (offset - 1) + '^')


def parse_xml(file_path: Path):
    try:
        return minidom.parse(str(file_path))
    except Exception as e:
        msg = f'Parsing failed for file {str(file_path)} with {e}'
        print(f'*** ERROR: {msg}')
        if isinstance(e, ExpatError):
            xml_file = open(str(file_path), 'r')
            xml_lines = xml_file.readlines()
            print_xml_error(xml_lines, e.lineno, e.offset)
            raise ExpatError(msg, e)


def parse_test(node, module: str, file_name: Path, cat_full_name: str,
               cat_owner: str, cat_scrumteam: str, scan_id: int):
    """
    Parses tag for test and returns how many records posted into the DB
    :param node:
    :param module:
    :param file_name:
    :param cat_full_name:
    :param cat_owner:
    :param cat_scrumteam:
    :param scan_id:
    :return: how many records posted into DB - usually 1
    """
    class_name = node.getAttribute('class')
    # module: str, file_name: str, class_name: str, scrum_team:str, owner: str):
    return insert_xml_inventory(get_connection(), scan_id, module, str(file_name), class_name,
                                cat_full_name, cat_scrumteam, cat_owner)


def parse_category(node, category_path: str, owner: str, scrum_team: str, module: str,
                   file_name: Path, scan_id: int):
    """
    Parses Category tag and returns how many tests found
    :param node:
    :param category_path:
    :param owner:
    :param scrum_team:
    :param module:
    :param file_name:
    :param scan_id:
    :return:
    """
    tests_count = 0
    if node.nodeName == 'ftests':
        cat_scrumteam = None
        cat_owner = None
        cat_full_name = None
    else:
        cat_name = node.getAttribute('name')
        cat_scrumteam = node.getAttribute('scrumteam') or scrum_team
        cat_owner = node.getAttribute('owner') or owner
        cat_full_name = f'{category_path}/{cat_name}' if category_path else cat_name

    for node in node.childNodes:
        if node.nodeName == 'category':
            tests_count += parse_category(node, cat_full_name, cat_owner,
                                          cat_scrumteam, module, file_name, scan_id)
        if node.nodeName == 'test':
            tests_count += parse_test(node, module, file_name, cat_full_name,
                                      cat_owner, cat_scrumteam, scan_id)

    return tests_count


def extract_module_name(file_path: Path) -> str:
    pom_file = file_path.parent / 'pom.xml'
    if pom_file.exists():
        try:
            pom_doc = minidom.parse(str(pom_file))
            root = pom_doc.getElementsByTagName('project')
            if root.length == 1:
                artifact_node = next((n for n in root[0].childNodes if n.nodeName == 'artifactId'), '')
                return artifact_node.firstChild.data \
                    if artifact_node and artifact_node.firstChild \
                       and artifact_node.firstChild.data \
                    else ''

        except Exception as e:
            print(f'*** ERROR: Failed to find the pom.xml file for inventory {str(file_path)} with error {e}')
    else:
        print(f'*** ERROR: Failed to find the pom.xml file for inventory {str(file_path)}')


def evaluate_xml_inventory(file_path: Path, scan_id: int, module: str) -> (int, int, int):
    """
    Evaluates the inventory file and parses if it matches the expected XML sctructure
    :param file_path: Path to the possible inventory file
    :param scan_id: Current scan_id
    :param module: Name of the current module
    :return: Tuple (tests_count, files_count, failed_files_count)
    """
    verbose(f'Evaluating {str(file_path)}')
    try:
        content = file_path.read_text()
    except Exception as e:
        print(f"*** ERROR: Failed to read the file  {str(file_path)} because of error {e}")
        return 0, 1, 1
    if "<ftests" in content:
        try:
            xml_dom = parse_xml(file_path)
            node = xml_dom.documentElement

            if not node.nodeName == 'ftests':
                print(f'*** ERROR:  Not a valid inventory  {str(file_path)}')
                return 0, 1, 1

            tests_count = parse_category(node, '', '', '', module, file_path, scan_id)
            print(f'*** INFO:  found {tests_count} tests in {str(file_path)}')
            return tests_count, 1, 0
        except SyntaxError as e:
            print(f"*** ERROR: Skipping file  {str(file_path)} because of error {e}")
        except Exception as e:
            print(f"*** ERROR: Skipping file  {str(file_path)} because of error {e}")
    verbose(f' Not valid inventory {str(file_path)}')
    return 0, 0, 0


def find_xml_inventory(path: Path) -> bool:
    """
    Runs through the file system and finds all the xml files
    :param path: Path to scan
    :return: Returns False if path does not exist
    """
    print(f'*** INFO: Searching for inventory files in {str(path)}')
    if not path.exists():
        print(f'*** ERROR: Path does not exist: {str(path)}')
        return False
    scan_id = find_new_scan_id(get_connection())
    print(f'*** INFO:  scan_id = {scan_id}')

    tests_count = 0
    files_count = 0
    files_skipped = 0
    failed_files_count = 0

    for filename in path.glob('**/*.xml'):
        if os.path.isfile(filename) and \
                filename.name not in [
            'pom.xml'
        ]:
            module = extract_module_name(filename)

            if not module:
                verbose(f'skipping file as it is not in the module root {str(filename)}')
                continue

            inv_tests_count, inv_files_count, inv_failed_files_count = \
                evaluate_xml_inventory(filename, scan_id, module)
            tests_count += inv_tests_count
            files_count += inv_files_count
            failed_files_count += inv_failed_files_count
            files_skipped += 1 - inv_files_count

    print(f'*** INFO:  scan_id = {scan_id} detected {tests_count} tests in {files_count} files with'
          f' failed scans on {failed_files_count} files and {files_skipped} skipped files')
    clean_previous_scans(get_connection(), scan_id)

    return True


def main():
    from docopt import docopt
    opts = docopt(__doc__)

    if opts['-v']:
        global verbose_log
        verbose_log = True
    print(f"Works!")
    conn = get_connection()

    try:
        find_xml_inventory(Path(os.path.expanduser('~/blt/app/main/core')))
    finally:
        # CLOSE THE CONNECTION
        if conn:
            conn.close()


if __name__ == '__main__':
    main()
