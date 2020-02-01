# AnChatBot

[![Greenkeeper badge](https://badges.greenkeeper.io/Perkovec/AnChatBot.svg)](https://greenkeeper.io/)

Анонимный чат для телегамма
## Установка
Скопируйте репозиторий и установите зависимости
```bash
git clone https://github.com/Perkovec/AnChatBot.git
cd AnChatBot
npm install
```
Установите и запустите [`CouchDB`](http://couchdb.apache.org/#download)

```bash
# Linux
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:couchdb/stable
sudo apt-get update
sudo apt-get install couchdb
sudo chown -R couchdb:couchdb /usr/bin/couchdb /etc/couchdb /usr/share/couchdb
sudo chmod -R 0770 /usr/bin/couchdb /etc/couchdb /usr/share/couchdb
```

Создайте администратора для CouchDB
```bash
HOST="http://127.0.0.1:5984" # адрес базы данных
curl -X PUT $HOST/_config/admins/имя_пользователя -d '"пароль"'
```

Переименуйте `config.example.json` в `config.json` и настройте под себя.

Затем необходимо настроить базу данных
```bash
node setup_db.js
```

Теперь можно запускать
```bash
npm start
```