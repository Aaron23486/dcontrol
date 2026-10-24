#!/bin/sh
# Crea la base usada por las pruebas de integración, separada de la de desarrollo.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
  CREATE DATABASE "${POSTGRES_DB}_test";
SQL
