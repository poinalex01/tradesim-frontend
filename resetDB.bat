docker stop tradesim
docker rm tradesim
docker run --name tradesim -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=tradesim -p 5432:5432 -d postgres