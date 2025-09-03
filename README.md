## Vereisten

Ik verwacht dat volgende software reeds geïnstalleerd is:

- [NodeJS](https://nodejs.org)
- [Yarn](https://yarnpkg.com)
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
- Dependencies uit [package.json](package.json)

## Opstarten

1. Maak een `.env` bestand aan in de root met als inhoud:

```bash
NODE_ENV=[production|development]
DATABASE_USERNAME=LOGIN_GEBRUIKERSNAAM_VAN_MYSQL_DATABASE
DATABASE_PASSWORD=LOGIN_WACHTWOORD_VAN_MYSQL_DATABASE
```

2. Open een terminal en voer `yarn start` uit.

3. De url en poort zal in de terminal zichtbaar zijn.

## Testen

1. Maak een `.env.test` bestand aan in de root met als inhoud:

```bash
NODE_ENV=test
DATABASE_USERNAME=LOGIN_GEBRUIKERSNAAM_VAN_MYSQL_DATABASE
DATABASE_PASSWORD=LOGIN_WACHTWOORD_VAN_MYSQL_DATABASE
```

2. Open een terminal en voer `yarn test` uit.

3. Alle test suites zullen nu uitgevoerd worden en de resultaat zal ook in de terminal zichtbaar zijn.

Om de **_coverage test_** uit te voeren moet je op stap 2 in plaats van `yarn test`, `yarn test --coverage` uitvoeren. De coverage resultaten/report zal in de terminal zichtbaar zijn maar ook in een nieuwe folder _`coverage`_ onder _`__tests__/coverage`_.
