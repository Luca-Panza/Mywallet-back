import request from 'supertest';
import { ObjectId } from 'mongodb';
import app from '../../src/app.js';
import { getDb, createUserWithSession } from '../helpers/database.helper.js';
import { generateTransaction, generateCategory } from '../helpers/factories.js';

describe('Transaction Routes', () => {
  describe('POST /new-transaction/:type', () => {
    it('deve criar transação de entrada (income) com token válido', async () => {
      const { token } = await createUserWithSession();
      const transactionData = generateTransaction('income');
      
      const response = await request(app)
        .post('/new-transaction/income')
        .set('Authorization', `Bearer ${token}`)
        .send(transactionData);
      
      expect(response.status).toBe(201);
      
      const db = getDb();
      const transaction = await db.collection('transactions').findOne({ 
        description: transactionData.description 
      });
      
      expect(transaction).toBeTruthy();
      expect(transaction.type).toBe('income');
      expect(transaction.amount).toBe(transactionData.amount);
    });

    it('deve criar transação de saída (expense) com token válido', async () => {
      const { token } = await createUserWithSession();
      const transactionData = generateTransaction('expense');
      
      const response = await request(app)
        .post('/new-transaction/expense')
        .set('Authorization', `Bearer ${token}`)
        .send(transactionData);
      
      expect(response.status).toBe(201);
      
      const db = getDb();
      const transaction = await db.collection('transactions').findOne({ 
        description: transactionData.description 
      });
      
      expect(transaction).toBeTruthy();
      expect(transaction.type).toBe('expense');
    });

    it('deve rejeitar sem token', async () => {
      const transactionData = generateTransaction();
      
      const response = await request(app)
        .post('/new-transaction/income')
        .send(transactionData);
      
      expect(response.status).toBe(422);
    });

    it('deve rejeitar com token inválido', async () => {
      const transactionData = generateTransaction();
      
      const response = await request(app)
        .post('/new-transaction/income')
        .set('Authorization', 'Bearer invalid-token-with-length-36chars')
        .send(transactionData);
      
      expect(response.status).toBe(401);
    });

    it('deve validar tipo de transação', async () => {
      const { token } = await createUserWithSession();
      const transactionData = generateTransaction();
      
      const response = await request(app)
        .post('/new-transaction/invalid-type')
        .set('Authorization', `Bearer ${token}`)
        .send(transactionData);
      
      expect(response.status).toBe(422);
    });

    it('deve criar transação com categoryId válido', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const categoryData = generateCategory('income');
      const categoryResult = await db.collection('categories').insertOne({
        userId: user._id,
        ...categoryData
      });
      
      const transactionData = {
        ...generateTransaction('income'),
        categoryId: categoryResult.insertedId.toString()
      };
      
      const response = await request(app)
        .post('/new-transaction/income')
        .set('Authorization', `Bearer ${token}`)
        .send(transactionData);
      
      expect(response.status).toBe(201);
      
      const transaction = await db.collection('transactions').findOne({ 
        description: transactionData.description 
      });
      expect(transaction.categoryId).toBe(categoryResult.insertedId.toString());
    });

    it('deve rejeitar categoria de tipo incompatível', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const categoryData = generateCategory('expense');
      const categoryResult = await db.collection('categories').insertOne({
        userId: user._id,
        ...categoryData
      });
      
      const transactionData = {
        ...generateTransaction('income'),
        categoryId: categoryResult.insertedId.toString()
      };
      
      const response = await request(app)
        .post('/new-transaction/income')
        .set('Authorization', `Bearer ${token}`)
        .send(transactionData);
      
      expect(response.status).toBe(400);
      expect(response.text).toBe("Category type does not match transaction type!");
    });

    it('deve formatar amount com 2 casas decimais', async () => {
      const { token } = await createUserWithSession();
      const transactionData = {
        ...generateTransaction(),
        amount: 123.456789
      };
      
      const response = await request(app)
        .post('/new-transaction/income')
        .set('Authorization', `Bearer ${token}`)
        .send(transactionData);
      
      expect(response.status).toBe(201);
      
      const db = getDb();
      const transaction = await db.collection('transactions').findOne({ 
        description: transactionData.description 
      });
      
      expect(transaction.amount).toBe(123.46);
    });

    it('deve usar data atual se não fornecida', async () => {
      const { token } = await createUserWithSession();
      const transactionData = generateTransaction();
      delete transactionData.date;
      
      const beforeRequest = new Date();
      
      const response = await request(app)
        .post('/new-transaction/income')
        .set('Authorization', `Bearer ${token}`)
        .send(transactionData);
      
      expect(response.status).toBe(201);
      
      const db = getDb();
      const transaction = await db.collection('transactions').findOne({ 
        description: transactionData.description 
      });
      
      const afterRequest = new Date();
      const transactionDate = new Date(transaction.date);
      
      expect(transactionDate.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());
      expect(transactionDate.getTime()).toBeLessThanOrEqual(afterRequest.getTime());
    });
  });

  describe('GET /transactions', () => {
    it('deve listar transações do usuário autenticado', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const transaction1 = generateTransaction();
      const transaction2 = generateTransaction();
      
      await db.collection('transactions').insertMany([
        { ...transaction1, id: user._id, type: 'income', date: new Date() },
        { ...transaction2, id: user._id, type: 'expense', date: new Date() }
      ]);
      
      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('deve retornar array vazio se sem transações', async () => {
      const { token } = await createUserWithSession();
      
      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('deve ordenar por data decrescente', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-12-31');
      
      await db.collection('transactions').insertMany([
        { ...generateTransaction(), id: user._id, type: 'income', date: oldDate },
        { ...generateTransaction(), id: user._id, type: 'income', date: newDate }
      ]);
      
      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(new Date(response.body[0].date).getTime()).toBeGreaterThan(
        new Date(response.body[1].date).getTime()
      );
    });

    it('deve rejeitar sem token', async () => {
      const response = await request(app)
        .get('/transactions');
      
      expect(response.status).toBe(401);
    });

    it('não deve listar transações de outros usuários', async () => {
      const { token: token1, user: user1 } = await createUserWithSession({ email: 'user1@test.com' });
      const { user: user2 } = await createUserWithSession({ email: 'user2@test.com' });
      const db = getDb();
      
      await db.collection('transactions').insertMany([
        { ...generateTransaction(), id: user1._id, type: 'income', date: new Date() },
        { ...generateTransaction(), id: user2._id, type: 'income', date: new Date() }
      ]);
      
      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${token1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id.toString()).toBe(user1._id.toString());
    });
  });

  describe('GET /transactions/summary', () => {
    it('deve retornar resumo agrupado por categoria', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const categoryResult = await db.collection('categories').insertOne({
        userId: user._id,
        name: 'Salário',
        type: 'income'
      });
      
      await db.collection('transactions').insertMany([
        { description: 'Trans 1', amount: 100, id: user._id, type: 'income', 
          categoryId: categoryResult.insertedId.toString(), date: new Date() },
        { description: 'Trans 2', amount: 200, id: user._id, type: 'income', 
          categoryId: categoryResult.insertedId.toString(), date: new Date() }
      ]);
      
      const response = await request(app)
        .get('/transactions/summary')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].totalAmount).toBe(300);
      expect(response.body[0].count).toBe(2);
    });

    it('deve rejeitar sem token', async () => {
      const response = await request(app)
        .get('/transactions/summary');
      
      expect(response.status).toBe(422);
    });
  });

  describe('GET /transaction/:id', () => {
    it('deve retornar transação específica do usuário', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const transactionData = generateTransaction();
      const result = await db.collection('transactions').insertOne({
        ...transactionData,
        id: user._id,
        type: 'income',
        date: new Date()
      });
      
      const response = await request(app)
        .get(`/transaction/${result.insertedId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.description).toBe(transactionData.description);
    });

    it('deve rejeitar se transação não existe', async () => {
      const { token } = await createUserWithSession();
      const fakeId = new ObjectId();
      
      const response = await request(app)
        .get(`/transaction/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(404);
    });

    it('deve rejeitar se transação pertence a outro usuário', async () => {
      const { token: token1 } = await createUserWithSession({ email: 'user1@test.com' });
      const { user: user2 } = await createUserWithSession({ email: 'user2@test.com' });
      const db = getDb();
      
      const result = await db.collection('transactions').insertOne({
        ...generateTransaction(),
        id: user2._id,
        type: 'income',
        date: new Date()
      });
      
      const response = await request(app)
        .get(`/transaction/${result.insertedId}`)
        .set('Authorization', `Bearer ${token1}`);
      
      expect(response.status).toBe(404);
    });

    it('deve rejeitar sem token', async () => {
      const fakeId = new ObjectId();
      
      const response = await request(app)
        .get(`/transaction/${fakeId}`);
      
      expect(response.status).toBe(422);
    });
  });

  describe('PUT /transaction/:id', () => {
    it('deve atualizar transação existente', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const transactionData = generateTransaction();
      const result = await db.collection('transactions').insertOne({
        ...transactionData,
        id: user._id,
        type: 'income',
        date: new Date()
      });
      
      const updateData = {
        description: 'Updated description',
        amount: 999.99
      };
      
      const response = await request(app)
        .put(`/transaction/${result.insertedId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      
      const updated = await db.collection('transactions').findOne({ _id: result.insertedId });
      expect(updated.description).toBe(updateData.description);
      expect(updated.amount).toBe(updateData.amount);
    });

    it('deve validar categoryId se fornecido', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const result = await db.collection('transactions').insertOne({
        ...generateTransaction(),
        id: user._id,
        type: 'income',
        date: new Date()
      });
      
      const categoryResult = await db.collection('categories').insertOne({
        userId: user._id,
        name: 'Test Category',
        type: 'income'
      });
      
      const updateData = {
        description: 'Updated',
        amount: 100,
        categoryId: categoryResult.insertedId.toString()
      };
      
      const response = await request(app)
        .put(`/transaction/${result.insertedId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
    });

    it('deve manter tipo da transação ao validar categoria', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const result = await db.collection('transactions').insertOne({
        ...generateTransaction(),
        id: user._id,
        type: 'income',
        date: new Date()
      });
      
      const categoryResult = await db.collection('categories').insertOne({
        userId: user._id,
        name: 'Expense Category',
        type: 'expense'
      });
      
      const updateData = {
        description: 'Updated',
        amount: 100,
        categoryId: categoryResult.insertedId.toString()
      };
      
      const response = await request(app)
        .put(`/transaction/${result.insertedId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      expect(response.status).toBe(400);
    });

    it('deve rejeitar se transação não existe', async () => {
      const { token } = await createUserWithSession();
      const fakeId = new ObjectId();
      
      const response = await request(app)
        .put(`/transaction/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Test', amount: 100 });
      
      expect(response.status).toBe(404);
    });

    it('deve rejeitar sem token', async () => {
      const fakeId = new ObjectId();
      
      const response = await request(app)
        .put(`/transaction/${fakeId}`)
        .send({ description: 'Test', amount: 100 });
      
      expect(response.status).toBe(422);
    });
  });

  describe('DELETE /transaction/:id', () => {
    it('deve deletar transação existente', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const result = await db.collection('transactions').insertOne({
        ...generateTransaction(),
        id: user._id,
        type: 'income',
        date: new Date()
      });
      
      const response = await request(app)
        .delete(`/transaction/${result.insertedId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      
      const deleted = await db.collection('transactions').findOne({ _id: result.insertedId });
      expect(deleted).toBeNull();
    });

    it('deve rejeitar se transação não existe', async () => {
      const { token } = await createUserWithSession();
      const fakeId = new ObjectId();
      
      const response = await request(app)
        .delete(`/transaction/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(404);
    });

    it('deve rejeitar sem token', async () => {
      const fakeId = new ObjectId();
      
      const response = await request(app)
        .delete(`/transaction/${fakeId}`);
      
      expect(response.status).toBe(422);
    });

    it('não deve deletar transação de outro usuário', async () => {
      const { token: token1 } = await createUserWithSession({ email: 'user1@test.com' });
      const { user: user2 } = await createUserWithSession({ email: 'user2@test.com' });
      const db = getDb();
      
      const result = await db.collection('transactions').insertOne({
        ...generateTransaction(),
        id: user2._id,
        type: 'income',
        date: new Date()
      });
      
      const response = await request(app)
        .delete(`/transaction/${result.insertedId}`)
        .set('Authorization', `Bearer ${token1}`);
      
      expect(response.status).toBe(404);
      
      const stillExists = await db.collection('transactions').findOne({ _id: result.insertedId });
      expect(stillExists).toBeTruthy();
    });
  });
});
