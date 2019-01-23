# GRUUT AUTHORITY

'Gruut authority' is certificate authority server.
The server receives a CSR(Certificate signing request) from a signer who wants to join in the network and generates a certificate using RSA signing.

[![Build Status](https://travis-ci.org/gruut/gruut-authority.svg?branch=master)](https://travis-ci.org/gruut/gruut-authority)

## Requirements

* Node ≥ v10.11.0
  
* NPM ≥ v6.5.0

* MariaDB
  
* Botan library
  1) Clone a repository
     + `git clone https://github.com/randombit/botan.git`
  2) Run a script file(`configure.py`)
  3) `make && make install`

> We have tested on 'Ubuntu 18.04', 'macOS Mojave 10.14.2.'

## Installation

### 1. Setting a environment file

We are using a [dotenv](https://github.com/motdotla/dotenv) package.
```shell
$ vim ${yourProjectRoot}/.env
```

Sample environment file
```
# ${yourProjectRoot}/.env

SEQUELIZE_USER="root"
SEQUELIZE_PASSWORD="1234"
NODE_ENV="development"
GA_PORT="3000"
```

### 2. Install dependencies

```shell
$ npm install
$ sequelize db:create
$ sequelize db:migrate
$ npm run prod
```
