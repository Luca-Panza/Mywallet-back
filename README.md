# <p align = "center"> API MyWallet </p>

<p align="center">
   <img width=176px; src="./src/assets/wallet.png"/>
</p>

<p align = "center">
   <img src="https://img.shields.io/badge/author-Luca_Panza-4dae71?style=flat-square" />
   <img src="https://img.shields.io/github/languages/count/Luca-Panza/projeto14-mywallet-back?color=4dae71&style=flat-square" />
</p>


##  :clipboard: Description

This project is a backend API for a personal financial management system, built using Node.js and Express. It focuses on managing users' financial transactions, enabling them to record their income and expenses. The system provides functionalities to add transactions and view a detailed history of their finances. It employs technologies such as MongoDB and JavaScript, ensuring an efficient and well-structured layered architecture.

Deployment on Render: <a href="https://mywallet-api-njln.onrender.com" target="_blank">Api MyWallet Deploy</a>
***

## :computer:	 Technologies and Concepts

- REST APIs
- MongoDB
- JavaScript
- Node.js
- Express.js
- Joi (validation)
- StripHtml
- Bcrypt
- uuid
- dotenv

***

## :rocket: Endpoints

### Authentication

```yml
POST /signUp
    - Endpoint to register a new user
    - headers: {}
    - body: {
        "name": "string",
        "email": "string",
        "password": "string"
       }
```
    
```yml 
POST /signIn
    - Endpoint to login
    - headers: {}
    - body: {
        "email": "string",
        "password": "string"
       }
```

### Transactions
    
```yml 
POST /new-transaction/:type
    - Endpoint to create a transaction for income or expense
    - type: income or expense
    - headers: {
        "Authorization": "token"
       }
    - body: {
        "description": "string",
        "amount": number,
        "category": "string" (optional)
       }
```

```yml 
GET /transactions
    - Endpoint to list all the transactions from a user
    - headers: {
        "Authorization": "token"
       }
    - body: {}
```

```yml 
GET /transactions/summary
    - Endpoint to get transaction summary by category
    - headers: {
        "Authorization": "token"
       }
    - body: {}
```

```yml 
GET /transaction/:id
    - Endpoint to get a specific transaction by ID
    - headers: {
        "Authorization": "token"
       }
    - params: { "id": "string" }
    - body: {}
```

```yml 
PUT /transaction/:id
    - Endpoint to update a transaction
    - headers: {
        "Authorization": "token"
       }
    - params: { "id": "string" }
    - body: {
        "description": "string",
        "amount": number,
        "type": "income" or "expense",
        "category": "string" (optional)
       }
```

```yml 
DELETE /transaction/:id
    - Endpoint to delete a transaction
    - headers: {
        "Authorization": "token"
       }
    - params: { "id": "string" }
    - body: {}
```

### Categories

```yml 
POST /categories
    - Endpoint to create a new category
    - headers: {
        "Authorization": "token"
       }
    - body: {
        "name": "string",
        "type": "income" or "expense",
        "icon": "string" (optional),
        "description": "string" (optional)
       }
```

```yml 
GET /categories
    - Endpoint to list all categories from a user
    - headers: {
        "Authorization": "token"
       }
    - body: {}
```

```yml 
PUT /categories/:id
    - Endpoint to update a category
    - headers: {
        "Authorization": "token"
       }
    - params: { "id": "string" }
    - body: {
        "name": "string",
        "type": "income" or "expense",
        "icon": "string" (optional),
        "description": "string" (optional)
       }
```

```yml 
DELETE /categories/:id
    - Endpoint to delete a category
    - headers: {
        "Authorization": "token"
       }
    - params: { "id": "string" }
    - body: {}
```

***

## 🏁 Running the application

Make sure you have the latest installed stable version of [Node.js](https://nodejs.org/en/download/), [npm](https://www.npmjs.com/) and [MongoDB](https://www.mongodb.com/) running locally.

First, clone this repository on your machine:

```
git clone https://github.com/Luca-Panza/Mywallet-back
```

Then, navigate to the project folder and install the dependencies:

```
npm install
```

Create a `.env` file in the root of the project based on the `.env.example` file:

```
DATABASE_URL=mongodb://localhost:27017/mywallet
PORT=5000
```

Before starting the application, make sure MongoDB is running on your machine by executing the following command:

```
mongod --dbpath ~/.mongo
```

Or if you have MongoDB installed as a service:

```
sudo systemctl start mongod
```

Once everything is configured, start the server:

```
npm start
```

Or to run in development mode with auto-reload:

```
npm run dev
```
