drop database if exists tododashboard;
create database tododashboard;

use tododashboard;

drop table if exists todos;
create table todos (
    id int not null auto_increment,
    title varchar(255) not null,
    description varchar(1000) not null,
    date date not null,
    todoOrder int not null,
    isCHEagenda boolean default false,
    primary key (id)
);

drop procedure if exists insertAtodoTask;
DELIMITER $$
CREATE PROCEDURE insertAtodoTask (IN title VARCHAR(255), IN description VARCHAR(255), IN insertDate DATE, IN isCHEAgenda BOOLEAN, IN user_id INT)
BEGIN
    DECLARE todoOrder INT;
    DECLARE isCHEAgendaCheck BOOLEAN DEFAULT false;
    IF isCHEAgenda IS NOT NULL THEN
        SET isCHEAgendaCheck = isCHEAgenda;
    END IF;
    SELECT COUNT(*) INTO todoOrder FROM todos WHERE date = insertDate;
    INSERT INTO todos (title, description, date, todoOrder, isCHEAgenda, userId) VALUES  (title, description, insertDate, todoOrder + 1, isCHEAgendaCheck, user_id);
    SELECT LAST_INSERT_ID() as id;
END $$
DELIMITER ;

drop table if exists irrelevantAgendaTodos;
create table irrelevantAgendaTodos (
    id int not null auto_increment,
    todoId int not null,
    primary key (id),
    constraint fk_todoId foreign key (todoId) references todos(id) on delete cascade,
    constraint uq_todoId unique (todoId)
);

drop procedure if exists insertAnIrrelevantAgendaTodo;
DELIMITER $$
CREATE PROCEDURE insertAnIrrelevantAgendaTodo (IN todoId INT, IN user_id INT)
BEGIN
    DECLARE isCHEAgendaBool BOOLEAN;
    DECLARE isusersTodo BOOLEAN;
    SELECT isCHEAgenda INTO isCHEAgendaBool FROM todos WHERE id = todoId AND userId = user_id;
    SELECT 1 INTO isusersTodo FROM todos WHERE id = todoId AND userId = user_id;
    IF isCHEAgendaBool = 1 AND isusersTodo = 1 THEN
        INSERT INTO irrelevantagendatodos (todoId) VALUES (todoId);
        SELECT last_insert_id() as id;
    END IF;

    IF isusersTodo = 0 THEN
        select 0 as id;
    END IF;
END $$
DELIMITER ;

create table users (
    id int not null auto_increment,
    username varchar(255) not null,
    password varchar(255) not null,
    email varchar(255) not null,
    primary key (id),
    constraint uq_username unique (username),
    constraint uq_email unique (email),
    constraint uq_username_email unique (username, email)
);

alter table todos add column userId int;
