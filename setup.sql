CREATE DATABASE accounts;
\c accounts
CREATE TABLE PSW (
	id SERIAL PRIMARY KEY,
	username VARCHAR(20),
	passwords VARCHAR(20),
);
