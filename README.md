### Musicmeta - Solo project

This is the server-side component to the [MusicMeta fontend](https://github.com/Pyrrhusn/musicmeta-frontend). It provides a RESTful API for managing and retrieving music metadata. The backend is built for efficiency, scalability, and modern JavaScript development standards. For a in-depth overview/explanation and screenshots, have a look at this [file](/dossier.md).

#### Technologies Used (non-exhaustive)

- **Node.js** – The runtime environment for executing server-side JavaScript.
- **Koa** – A lightweight and expressive web server framework for Node.js, used to handle all HTTP requests and responses.
- **Middlewares** – Modular Koa middleware for request parsing, error handling, logging, authentication.
- **JWT** - manage auth state
- **Objection ORM** - relational mappings and querying of entites in MySQL database.

#### Dependencies
Following software is required to run this project:
- [NodeJS](https://nodejs.org)
- [Yarn](https://yarnpkg.com)
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
- Dependencies in [package.json](package.json)

#### Startup

1. Create a `.env` file in the root directory with the following content:

```bash
NODE_ENV=[production|development]
DATABASE_USERNAME=YOUR_MYSQL_DATABASE_LOGIN_USERNAME
DATABASE_PASSWORD=YOUR_MYSQL_DATABASE_LOGIN_PASSWORD
```

2. Open a terminal and run `yarn start`.

3. The URL and port will be visible in the terminal.

#### Testing

1. Create a `.env.test` file in the root directory with the following content:

```bash
NODE_ENV=test
DATABASE_USERNAME=YOUR_MYSQL_DATABASE_LOGIN_USERNAME
DATABASE_PASSWORD=YOUR_MYSQL_DATABASE_LOGIN_PASSWORD
```

2. Open a terminal and run `yarn test`.

3. All test suites will now be executed and the results will also be visible in the terminal.

To run the **_coverage test_**, in step 2, run `yarn test --coverage` instead of `yarn test`. The coverage results/report will be visible in the terminal as well as in a new folder called _`coverage`_ under _`__tests__/coverage`_.
