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
- StripHtml
- Bcrypt
- uuid

***

## :rocket: Endpoints

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
    
```yml 
POST /new-transaction/:id
    - Endpoint to create an transaction for income or expense
    - id: income or expense
    - headers: {
        "Authorization": `Bearer ${token}`
       }
    - body: {
        "description": "string",
        "amount": "number"
       }
```

```yml 
GET /transactions
    - Endpoint to list all the transactions from a user
    - params: {}
    - headers: {
        "Authorization": `Bearer ${token}`
       }
    - body: {}
```

***

## 🏁 Running the application

Make sure you have the latest installed stable version of [Node.js](https://nodejs.org/en/download/), [npm](https://www.npmjs.com/) and [MongoDB](https://www.mongodb.com/) running locally.

First, clone this repository on your machine:

```
git clone https://github.com/Luca-Panza/projeto14-mywallet-back
```

Before starting the application, make sure MongoDB is running on your machine by executing the following command:

```
mongod --dbpath ~/.mongo
```

Then, navigate to the project folder and install the dependencies with the following command:

```
npm install
```

Once the process is finished, just start the server.

```
npm start
```

Or to test on a development server.

```
npm run dev
```
