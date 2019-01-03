#!/usr/bin/env bash
`which botan` keygen --algo=RSA --params=3072 > ./GA_sk.pem
`which botan` gen_self_signed ./GA_sk.pem //////////8= --country=KR --dns="gruut.net" --organization="Gruut Networks" --email="contact@gruut.net" --days=3650 --ca --hash=SHA-256 --emsa=EMSA4 > ./GA_certificate.pem
exit
