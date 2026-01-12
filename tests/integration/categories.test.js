import request from 'supertest';
import { ObjectId } from 'mongodb';
import app from '../../src/app.js';
import { getDb, createUserWithSession } from '../helpers/database.helper.js';
import { generateCategory } from '../helpers/factories.js';

describe('Category Routes', () => {
  describe('POST /categories', () => {
    it('deve criar categoria com dados válidos', async () => {
      const { token } = await createUserWithSession();
      const categoryData = generateCategory();
      
      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData);
      
      expect(response.status).toBe(201);
      
      const db = getDb();
      const category = await db.collection('categories').findOne({ 
        name: categoryData.name 
      });
      
      expect(category).toBeTruthy();
      expect(category.name).toBe(categoryData.name);
      expect(category.type).toBe(categoryData.type);
      expect(category.icon).toBe(categoryData.icon);
      expect(category.description).toBe(categoryData.description);
    });

    it('deve validar campos obrigatórios - sem name', async () => {
      const { token } = await createUserWithSession();
      const categoryData = generateCategory();
      delete categoryData.name;
      
      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData);
      
      expect(response.status).toBe(422);
    });

    it('deve validar campos obrigatórios - sem type', async () => {
      const { token } = await createUserWithSession();
      const categoryData = generateCategory();
      delete categoryData.type;
      
      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData);
      
      expect(response.status).toBe(422);
    });

    it('deve aceitar campos opcionais (icon, description)', async () => {
      const { token } = await createUserWithSession();
      const categoryData = {
        name: 'Test Category',
        type: 'income',
        icon: '💰',
        description: 'Test description'
      };
      
      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData);
      
      expect(response.status).toBe(201);
      
      const db = getDb();
      const category = await db.collection('categories').findOne({ 
        name: categoryData.name 
      });
      
      expect(category.icon).toBe(categoryData.icon);
      expect(category.description).toBe(categoryData.description);
    });

    it('deve rejeitar sem token', async () => {
      const categoryData = generateCategory();
      
      const response = await request(app)
        .post('/categories')
        .send(categoryData);
      
      expect(response.status).toBe(422);
    });

    it('deve rejeitar categoria duplicada (mesmo nome e tipo)', async () => {
      const { token, user } = await createUserWithSession();
      const categoryData = generateCategory();
      const db = getDb();
      
      await db.collection('categories').insertOne({
        userId: user._id,
        name: categoryData.name,
        type: categoryData.type,
        icon: '💰',
        description: 'Test'
      });
      
      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData);
      
      expect(response.status).toBe(409);
      expect(response.text).toBe("Category with this name and type already exists!");
    });

    it('deve permitir mesmo nome com tipos diferentes', async () => {
      const { token } = await createUserWithSession();
      
      const categoryData1 = {
        name: 'Test Category',
        type: 'income',
        icon: '💰',
        description: 'Income'
      };
      
      const categoryData2 = {
        name: 'Test Category',
        type: 'expense',
        icon: '💳',
        description: 'Expense'
      };
      
      const response1 = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData1);
      
      expect(response1.status).toBe(201);
      
      const response2 = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData2);
      
      expect(response2.status).toBe(201);
    });

    it('deve validar tipo de categoria (income ou expense)', async () => {
      const { token } = await createUserWithSession();
      const categoryData = {
        name: 'Test',
        type: 'invalid-type',
        icon: '💰',
        description: 'Test'
      };
      
      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData);
      
      expect(response.status).toBe(422);
    });
  });

  describe('GET /categories', () => {
    it('deve listar categorias do usuário', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const category1 = generateCategory('income');
      const category2 = generateCategory('expense');
      
      await db.collection('categories').insertMany([
        { ...category1, userId: user._id },
        { ...category2, userId: user._id }
      ]);
      
      const response = await request(app)
        .get('/categories')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('deve retornar array vazio se sem categorias', async () => {
      const { token } = await createUserWithSession();
      
      const response = await request(app)
        .get('/categories')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('deve rejeitar sem token', async () => {
      const response = await request(app)
        .get('/categories');
      
      expect(response.status).toBe(422);
    });

    it('não deve listar categorias de outros usuários', async () => {
      const { token: token1, user: user1 } = await createUserWithSession({ email: 'user1@test.com' });
      const { user: user2 } = await createUserWithSession({ email: 'user2@test.com' });
      const db = getDb();
      
      await db.collection('categories').insertMany([
        { ...generateCategory(), userId: user1._id },
        { ...generateCategory(), userId: user2._id }
      ]);
      
      const response = await request(app)
        .get('/categories')
        .set('Authorization', `Bearer ${token1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].userId.toString()).toBe(user1._id.toString());
    });
  });

  describe('PUT /categories/:id', () => {
    it('deve atualizar categoria existente', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const categoryData = generateCategory();
      const result = await db.collection('categories').insertOne({
        ...categoryData,
        userId: user._id
      });
      
      const updateData = {
        name: 'Updated Name',
        type: 'income',
        icon: '💵',
        description: 'Updated description'
      };
      
      const response = await request(app)
        .put(`/categories/${result.insertedId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      
      const updated = await db.collection('categories').findOne({ _id: result.insertedId });
      expect(updated.name).toBe(updateData.name);
      expect(updated.description).toBe(updateData.description);
    });

    it('deve rejeitar se categoria não existe', async () => {
      const { token } = await createUserWithSession();
      const fakeId = new ObjectId();
      
      const updateData = {
        name: 'Test',
        type: 'income',
        icon: '💰',
        description: 'Test'
      };
      
      const response = await request(app)
        .put(`/categories/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      expect(response.status).toBe(404);
    });

    it('deve rejeitar sem token', async () => {
      const fakeId = new ObjectId();
      
      const updateData = {
        name: 'Test',
        type: 'income',
        icon: '💰',
        description: 'Test'
      };
      
      const response = await request(app)
        .put(`/categories/${fakeId}`)
        .send(updateData);
      
      expect(response.status).toBe(422);
    });

    it('não deve atualizar categoria de outro usuário', async () => {
      const { token: token1 } = await createUserWithSession({ email: 'user1@test.com' });
      const { user: user2 } = await createUserWithSession({ email: 'user2@test.com' });
      const db = getDb();
      
      const result = await db.collection('categories').insertOne({
        ...generateCategory(),
        userId: user2._id
      });
      
      const updateData = {
        name: 'Updated',
        type: 'income',
        icon: '💰',
        description: 'Test'
      };
      
      const response = await request(app)
        .put(`/categories/${result.insertedId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData);
      
      expect(response.status).toBe(404);
    });

    it('deve rejeitar nome duplicado ao atualizar', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      await db.collection('categories').insertOne({
        userId: user._id,
        name: 'Existing Category',
        type: 'income',
        icon: '💰',
        description: 'Test'
      });
      
      const result = await db.collection('categories').insertOne({
        userId: user._id,
        name: 'Another Category',
        type: 'income',
        icon: '💵',
        description: 'Test'
      });
      
      const updateData = {
        name: 'Existing Category',
        type: 'income',
        icon: '💵',
        description: 'Test'
      };
      
      const response = await request(app)
        .put(`/categories/${result.insertedId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      expect(response.status).toBe(409);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('deve deletar categoria existente', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const result = await db.collection('categories').insertOne({
        ...generateCategory(),
        userId: user._id
      });
      
      const response = await request(app)
        .delete(`/categories/${result.insertedId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      
      const deleted = await db.collection('categories').findOne({ _id: result.insertedId });
      expect(deleted).toBeNull();
    });

    it('deve rejeitar se categoria não existe', async () => {
      const { token } = await createUserWithSession();
      const fakeId = new ObjectId();
      
      const response = await request(app)
        .delete(`/categories/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(404);
    });

    it('deve rejeitar sem token', async () => {
      const fakeId = new ObjectId();
      
      const response = await request(app)
        .delete(`/categories/${fakeId}`);
      
      expect(response.status).toBe(422);
    });

    it('não deve deletar categoria de outro usuário', async () => {
      const { token: token1 } = await createUserWithSession({ email: 'user1@test.com' });
      const { user: user2 } = await createUserWithSession({ email: 'user2@test.com' });
      const db = getDb();
      
      const result = await db.collection('categories').insertOne({
        ...generateCategory(),
        userId: user2._id
      });
      
      const response = await request(app)
        .delete(`/categories/${result.insertedId}`)
        .set('Authorization', `Bearer ${token1}`);
      
      expect(response.status).toBe(404);
      
      const stillExists = await db.collection('categories').findOne({ _id: result.insertedId });
      expect(stillExists).toBeTruthy();
    });

    it('deve remover categoryId das transações ao deletar categoria', async () => {
      const { token, user } = await createUserWithSession();
      const db = getDb();
      
      const categoryResult = await db.collection('categories').insertOne({
        userId: user._id,
        name: 'Test Category',
        type: 'income',
        icon: '💰',
        description: 'Test'
      });
      
      const transactionResult = await db.collection('transactions').insertOne({
        id: user._id,
        description: 'Test Transaction',
        amount: 100,
        type: 'income',
        categoryId: categoryResult.insertedId.toString(),
        date: new Date()
      });
      
      const response = await request(app)
        .delete(`/categories/${categoryResult.insertedId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      
      const transaction = await db.collection('transactions').findOne({ 
        _id: transactionResult.insertedId 
      });
      expect(transaction.categoryId).toBeUndefined();
    });
  });
});
