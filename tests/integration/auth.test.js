import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app.js';
import { getDb } from '../helpers/database.helper.js';
import { generateUser } from '../helpers/factories.js';

describe('Authentication Routes', () => {
  describe('POST /signUp', () => {
    it('deve criar usuário com dados válidos', async () => {
      const userData = generateUser();
      
      const response = await request(app)
        .post('/signUp')
        .send(userData);
      
      expect(response.status).toBe(201);
      
      const db = getDb();
      const user = await db.collection('users').findOne({ email: userData.email });
      
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password);
      
      const passwordMatch = bcrypt.compareSync(userData.password, user.password);
      expect(passwordMatch).toBe(true);
    });

    it('deve rejeitar email duplicado', async () => {
      const userData = generateUser();
      const db = getDb();
      
      const hashedPassword = bcrypt.hashSync(userData.password, 10);
      await db.collection('users').insertOne({
        name: userData.name,
        email: userData.email,
        password: hashedPassword
      });
      
      const response = await request(app)
        .post('/signUp')
        .send(userData);
      
      expect(response.status).toBe(409);
      expect(response.text).toBe("E-mail address is already used!");
    });

    it('deve validar campos obrigatórios - sem name', async () => {
      const userData = generateUser();
      delete userData.name;
      
      const response = await request(app)
        .post('/signUp')
        .send(userData);
      
      expect(response.status).toBe(422);
    });

    it('deve validar campos obrigatórios - sem email', async () => {
      const userData = generateUser();
      delete userData.email;
      
      const response = await request(app)
        .post('/signUp')
        .send(userData);
      
      expect(response.status).toBe(422);
    });

    it('deve validar campos obrigatórios - sem password', async () => {
      const userData = generateUser();
      delete userData.password;
      
      const response = await request(app)
        .post('/signUp')
        .send(userData);
      
      expect(response.status).toBe(422);
    });

    it('deve validar formato de email', async () => {
      const userData = generateUser();
      userData.email = 'invalid-email';
      
      const response = await request(app)
        .post('/signUp')
        .send(userData);
      
      expect(response.status).toBe(422);
    });

    it('deve sanitizar inputs com stripHtml', async () => {
      const userData = {
        name: '<script>alert("xss")</script>Test User',
        email: 'test@test.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/signUp')
        .send(userData);
      
      expect(response.status).toBe(201);
      
      const db = getDb();
      const user = await db.collection('users').findOne({ email: userData.email });
      
      expect(user.name).not.toContain('<script>');
      expect(user.name).toBe('Test User');
    });
  });

  describe('POST /signIn', () => {
    it('deve autenticar com credenciais válidas', async () => {
      const userData = generateUser();
      const db = getDb();
      
      const hashedPassword = bcrypt.hashSync(userData.password, 10);
      const userResult = await db.collection('users').insertOne({
        name: userData.name,
        email: userData.email,
        password: hashedPassword
      });
      
      const response = await request(app)
        .post('/signIn')
        .send({
          email: userData.email,
          password: userData.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('name', userData.name);
      expect(typeof response.body.token).toBe('string');
      
      const session = await db.collection('sessions').findOne({ id: userResult.insertedId });
      expect(session).toBeTruthy();
      expect(session.token).toBe(response.body.token);
    });

    it('deve rejeitar email inexistente', async () => {
      const userData = generateUser();
      
      const response = await request(app)
        .post('/signIn')
        .send({
          email: userData.email,
          password: userData.password
        });
      
      expect(response.status).toBe(404);
      expect(response.text).toBe("User not found");
    });

    it('deve rejeitar senha incorreta', async () => {
      const userData = generateUser();
      const db = getDb();
      
      const hashedPassword = bcrypt.hashSync(userData.password, 10);
      await db.collection('users').insertOne({
        name: userData.name,
        email: userData.email,
        password: hashedPassword
      });
      
      const response = await request(app)
        .post('/signIn')
        .send({
          email: userData.email,
          password: 'wrong-password'
        });
      
      expect(response.status).toBe(401);
      expect(response.text).toBe("Wrong password");
    });

    it('deve invalidar sessão anterior ao criar nova', async () => {
      const userData = generateUser();
      const db = getDb();
      
      const hashedPassword = bcrypt.hashSync(userData.password, 10);
      const userResult = await db.collection('users').insertOne({
        name: userData.name,
        email: userData.email,
        password: hashedPassword
      });
      
      await db.collection('sessions').insertOne({
        id: userResult.insertedId,
        token: 'old-token'
      });
      
      const response = await request(app)
        .post('/signIn')
        .send({
          email: userData.email,
          password: userData.password
        });
      
      expect(response.status).toBe(200);
      
      const oldSession = await db.collection('sessions').findOne({ token: 'old-token' });
      expect(oldSession).toBeNull();
      
      const newSession = await db.collection('sessions').findOne({ id: userResult.insertedId });
      expect(newSession).toBeTruthy();
      expect(newSession.token).toBe(response.body.token);
    });

    it('deve validar campos obrigatórios - sem email', async () => {
      const response = await request(app)
        .post('/signIn')
        .send({
          password: 'password123'
        });
      
      expect(response.status).toBe(422);
    });

    it('deve validar campos obrigatórios - sem password', async () => {
      const response = await request(app)
        .post('/signIn')
        .send({
          email: 'test@test.com'
        });
      
      expect(response.status).toBe(422);
    });

    it('deve validar formato de email', async () => {
      const response = await request(app)
        .post('/signIn')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });
      
      expect(response.status).toBe(422);
    });
  });
});
