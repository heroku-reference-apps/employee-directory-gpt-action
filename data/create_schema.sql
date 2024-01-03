create type department_enum as enum('Accounting','Sales','Engineering','Marketing','Product','Customer Service','HR');
create type title_enum as enum('Assistant', 'Manager', 'Junior Executive', 'President', 'Vice-President', 'Associate', 'Intern', 'Contractor');
create table employees(id char(36) not null unique primary key, first_name varchar(64) not null, last_name varchar(64) not null, email text not null, department department_enum not null, title title_enum not null, hire_date date not null);
