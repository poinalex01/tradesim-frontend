docker stop tradesim-db
docker rm tradesim-db
docker run --name tradesim-db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=tradinggame -p 5432:5432 -d postgres