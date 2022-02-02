create schema inventory;

create schema tests;

create table tests.teams
(
	id serial,
	name varchar(255)
);
create unique index teams_id_uindex	on tests.teams (id);
alter table tests.teams	add constraint teams_pk		primary key (id);

create table tests.team_aliases
(
	id serial,
	team_id int,
	name varchar(255),
	is_primary bit
);
create unique index team_aliases_id_uindex	on tests.team_aliases (id);
alter table tests.team_aliases	add constraint team_aliases_pk		primary key (id);

create table tests.tests
(
	id serial,
	class_name varchar(255),
	module_name varchar(255),
	test_type int,
	path_relative varchar(2000),
    test_inventory_present bit,
	ignored_methods varchar(255) ARRAY,
	in_dev int, -- 0 - none, -1 - all class, >0 - count of methods
	methods json
);
create unique index tests_id_uindex	on tests.tests (id);
alter table tests.tests	add constraint tests_pk		primary key (id);

create table tests.test_types
(
	id serial,
	name varchar(255)
);
create unique index test_types_id_uindex	on tests.test_types (id);
create unique index test_types_name_uindex	on tests.test_types (name);
alter table tests.test_types	add constraint test_types_pk		primary key (id);

INSERT INTO tests.test_types (id, name) VALUES (1, 'junit');
INSERT INTO tests.test_types (id, name) VALUES (2, 'junit-strict');
INSERT INTO tests.test_types (id, name) VALUES (3, 'xunit');
INSERT INTO tests.test_types (id, name) VALUES (4, 'func');

create table tests.libraries
(
	id serial,
	name varchar(255)
);
create unique index libraries_id_uindex	on tests.libraries (id);
alter table tests.libraries	add constraint libraries_pk		primary key (id);

INSERT INTO tests.libraries (id, name) VALUES (1, 'LPOP');
INSERT INTO tests.libraries (id, name) VALUES (2, 'SFX');
INSERT INTO tests.libraries (id, name) VALUES (3, 'Aloha');
INSERT INTO tests.libraries (id, name) VALUES (4, 'Mockito1');
INSERT INTO tests.libraries (id, name) VALUES (5, 'Mockito2');
INSERT INTO tests.libraries (id, name) VALUES (6, 'PowerMock');
INSERT INTO tests.libraries (id, name) VALUES (7, 'Selenium');

create table tests.j_test_libs
(
	test_id int constraint j_test_libs_tests_id_fk references tests.tests,
	lib_id int constraint j_test_libs_libraries_id_fk references tests.libraries
);

create table tests.j_test_types
(
	test_id int constraint j_test_types_tests_id_fk references tests.tests,
	type_id int constraint j_test_types_test_types_id_fk references tests.test_types
);

create table tests.info_source
(
	id serial,
	name varchar(255),
	label varchar(255)
);

create unique index info_source_id_uindex	    on tests.info_source (id);
create unique index info_source_label_uindex	on tests.info_source (label);
create unique index info_source_name_uindex	    on tests.info_source (name);
alter table tests.info_source	add constraint info_source_pk		primary key (id);
INSERT INTO tests.info_source (id, name, label) VALUES (1, 'FTestInventoryOwner', 'fTest inventory XML file - owner');
INSERT INTO tests.info_source (id, name, label) VALUES (2, 'FTestInventoryScrum', 'fTest inventory XML file - scrumteam');
INSERT INTO tests.info_source (id, name, label) VALUES (3, '@ScrumTeam-class', '@ScrumTeam class annotation');
INSERT INTO tests.info_source (id, name, label) VALUES (4, '@Owner-class', '@Owner class annotation');
INSERT INTO tests.info_source (id, name, label) VALUES (5, '@ScrumTeam-method', '@ScrumTeam method annotation');
INSERT INTO tests.info_source (id, name, label) VALUES (6, '@Owner-method', '@Owner method annotation');
INSERT INTO tests.info_source (id, name, label) VALUES (7, 'ownership.yaml', 'Ownership.yaml file');
INSERT INTO tests.info_source (id, name, label) VALUES (8, 'ScrumTeamJavaDoc', 'ScrumTeam javadoc');

create table tests.test_owners
(
	id serial,
	team_id int constraint test_owners_teams_id_fk references tests.teams,
	method varchar(255), -- Nullable
	source_id int constraint test_owners_info_source_id_fk references tests.info_source
);
create unique index test_owners_id_uindex	on tests.test_owners (id);
alter table tests.test_owners	add constraint test_owners_pk		primary key (id);

create table tests.xml_inventory
(
	id serial,
	class_name varchar(255),
	module varchar(255),
	file_path varchar(2000),
	owner varchar(255),
	scrum_team varchar(255),
	category varchar(2000),
	scan_id int not null -- id of the scan - to do not interrupt the indexing on update
);
create index xml_inventory_category_index	on tests.xml_inventory (category);
create index xml_inventory_class_name_index	on tests.xml_inventory (class_name);
create unique index xml_inventory_id_uindex	on tests.xml_inventory (id);
alter table tests.xml_inventory	add constraint xml_inventory_pk		primary key (id);

